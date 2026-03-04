# the puthon framework to create the server (analogy - react for backend - handling incoming requests and sends back responses)
from fastapi import FastAPI, Request
# lets react frontend talk to backend
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
import os
import json
# reads and loads .env file
from dotenv import load_dotenv
load_dotenv()

# creates fastAPI app instance
app = FastAPI()

# CORS - cross-origin resource sharing - setup
app.add_middleware(
    CORSMiddleware,
    # accepts requests from anywhere
    allow_origins=["*"],           
    allow_credentials=True,
    allow_methods=["*"],         
    allow_headers=["*"],          
)

# create groq client (never hardcode api keys always wrap)
client = Groq(api_key = os.getenv("GROQ_API_KEY"))

# THE ENDPOINT - ------------>>>
# decorator - telling fastAPI that when React sens a POST request to /process_text, run the func
@app.post("/process_text") #decorator

# async to pause/wait for the slow operations (think of enclosures)
async def process_text(request: Request): 
    data = await request.json() 
    text = data.get("text", "")

    # check if it's a bsic input from user to not waste an AI call
    if (not text) or (len(text) < 3):
        return {
            "error": "Text is to short to comprehend"}, 400 #http error
    

    
    #if fails, json shouldnt crash
    # CALL GROQ AI------>>
    try:
        response = client.chat.completions.create(
            model = "llama3-8b-8192",

            messages = [
                 # essentially to prompt engineer - telling/PROMPTING ai the format to return to parse reliably

                 # what is the job, how to format the response, what are the rules (return in json that you can parse)
                 # specify an example, use 0(= neg) to 1(= pos) scale, extract keywords that signify emotion (neutral, neg, pos)
                {"role": "system", 
                 "content": """Analyze sentiment and extract keywords. 
                 Return ONLY valid JSON with NO markdown:
                
                {"sentiment": .75, "keywords": ["word1", "word2"], "emotion": "positive"}
                
                sentiment: float 0-1 (0 = negative, 1 = positive)
                emotion: must be "positive", "negative", or "neutral"
                keywords: array of 3-7 important words"""
                },

                # 'user' message = the text you want to analyze/what the user inputted into mic (you're storing content you want to analyze)
                {"role": "user", 
                 "content": text}],

                temperature = 0.3, #controls randomness and creativity of AI (do not want to break parsing by getting too creative)... .3 is a consistent num
                max_tokens = 150 #length of ai response
                )

        # get raw response from ai
        raw_output = response.choices[0].message.content
        cleaned = raw_output.strip() # get rid of white space
        if cleaned.startswith("```"):
             cleaned = cleaned.split("```")[1]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
            
        # json str -> py dict
        parsed = json.loads(cleaned)

        required_fields = ["sentiment", "keywords", "emotion"] #all fields must exist, else error
        # check if key exists in dict, for all fields in required_fields
        if not all(field in parsed for field in required_fields):
            raise ValueError(f"Missing fields. Got:{parsed.keys()}")
                  
                  
            # sentiment bounds
        sentiment = float(parsed["sentiment"])
        if not 0 <= sentiment <= 1:
            sentiment = max(0.0, min(1.0, sentiment))

        # check if it's a list strs; if not, build the string by taking the first 10 words and convert into a string
        keywords = parsed["keywords"]
        if not isinstance(keywords, list):
            keywords = []
        
        keywords = [str(k) for k in keywords [:10]]

        emotion = parsed["emotion"]
        if emotion not in ["positive", "negative", "neutral"]:
            emotion = "neutral" #default

        return {
            "sentiment": sentiment,
            "keywords": keywords,
            "emotion": emotion,
            "success": True
        }
        

    # what happens if all crashes, keep backup data --> ERRORS -----------
    except json.JSONDecodeError as e:
        #no valid json was returned by ai
        return {
            "error": "AI did not return valid format",
            "success": False,
            "sentiment": 0.5, #default
            "keywords": [],
            "emotion": "neutral"
        }, 200

    # # limitations to how many full-requests you can make (openai = 3 requests)
    # except openai.error.RateLimitError:
    #     return {
    #         "error": "Exceeded Rate Limit",
    #         "success": False,
    #         "sentiment": 0.5,
    #         "keywords": [],
    #         "emotion": "neutral"
    #     }, 200
    
    except Exception as e:
        return {
            "error": f"Failed to process: {str(e)}",
            "success": False,
            "sentiment": 0.5,
            "keywords": [],
            "emotion": "neutral"
        }, 200

        








        
        
        
        
