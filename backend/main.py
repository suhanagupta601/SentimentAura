from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import openai
import os
import json
from openai import OpenAI 
from dotenv import load_dotenv
load_dotenv()


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           
    allow_credentials=True,
    allow_methods=["*"],         
    allow_headers=["*"],          
)
openai.api_key = os.getenv("OPENAI_API_KEY")


client = OpenAI(api_key=OPENAI_API_KEY)

@app.post("/process_text") #decorator

async def process_text(request: Request): #pause and wait for slow ops
    data = await request.json() #wait till slow ops finish
    text = data.get("text", "")

    # valid input text from user?
    if (not text) or (len(text) < 3):
        return {
            "error": "Text is to short to comprehend"}, 400 #http error
    

    
    #if fails, json shouldnt crash

    try:

        # call ai with a valid prompt/input

        response = client.chat.completions.create()(
            model = "gpt-3.5-turbo",

            messages = [
                 
                 # what is the job, how to format the response, what are the rules (return in json that you can parse)
                 # specify an example, use 0(neg)-1(pos) scale, extract keywords that signify emotion(neutral, neg, pos)
                {"role": "system", "content": """Analyze sentiment and extract keywords. 
                 Return ONLY valid JSON with NO markdown:
                
                {"sentiment": .75, "keywords": ["word1", "word2"], "emotion": "positive"}
                sentiment: float 0-1 (0 = negative, 1 = positive)
                emotion: must be "positive", "negative", or "neutral"
                keywords: array of 3-7 important words"""
                },

                #message from user, store content to analyze
                {"role": "user", "content": text}],
                temperature = 0.3, #controls randomness and creativity of AI (do not want to break parsing by getting to creative)
                max_tokens = 150 #length of ai response
                )

        raw_output = response.choices[0].message.content
        
        cleaned = raw_output.strip()

        if cleaned.startswith("```"):
             cleaned = cleaned.split("```")[1]

        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
            
        parsed = json.loads(cleaned)
        required_fields = ["sentiment", "keywords", "emotion"] #all must exist

        # check if key exists in dict, for all fields in required_fields
        if not all(field in parsed for field in required_fields):
            raise ValueError(f"Missing fields. Got:{parsed.keys()}")
                  
                  
        sentiment = float(parsed["sentiment"])
        if not 0 <= sentiment <= 1:
            sentiment = max(0.0, min(1.0, sentiment))

                # check if it's a list if not, build the string by taking the first 10 words and convert into a string
        keywords = parsed["keywords"]
        if not isinstance(keywords, list):
            keywords = []
            keywords = [str(k) for k in keywords [:10]]

        emotion = parsed["emotion"]
        if emotion not in ["positive", "negative", "neutral"]:
            emotion = "neutral" #default emotion

        return {
            "sentiment": sentiment,
            "keywords": keywords,
            "emotion": emotion,
            "success": True
        }
        

        # what happens if all crashes, keep backup data
    except json.JSONDecodeError as e:

        #no valid json was returned by ai
        return {
            "error": "AI did not return valid format",
            "success": False,
            "sentiment": 0.5,
            "keywords": [],
            "emotion": "neutral"
        }, 200 #error - frontend should not crash (test)

    # limitations to how many full-requests you can make (openai = 3 requests)
    except openai.error.RateLimitError:
        return {
            "error": "Exceeded Rate Limit",
            "success": False,
            "sentiment": 0.5,
            "keywords": [],
            "emotion": "neutral"
        }, 200
    
    except Exception as e:
        return {
            "error": f"Failed to process: {str(e)}",
            "success": False,
            "sentiment": 0.5,
            "keywords": [],
            "emotion": "neutral"
        }, 200

        








        
        
        
        
