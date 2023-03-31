import numpy as np
import insightface
from insightface.app import FaceAnalysis
import redis
import fastapi
#import cors 
from fastapi.middleware.cors import CORSMiddleware
#import basemodel
from pydantic import BaseModel
import base64
import cv2
import json
import com_id
import time
import http

#enable cors
origins = [
    "http://localhost",
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:8082",
    "*"
]

app = fastapi.FastAPI()



app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Image(BaseModel):
    image: str

ml = FaceAnalysis(allowed_modules=['detection',"recognition"])
ml.prepare(ctx_id = 0, det_size=(640, 640))
r=redis.Redis(host='localhost', port=6379, db=0)


@app.post("/encode")

def encode(image: Image,card_id: str):
    #convert base64 string to image
    img = base64.b64decode(image.image)
    img = np.frombuffer(img, dtype=np.uint8)
    img = cv2.imdecode(img, cv2.IMREAD_COLOR)
    #detect faces
    faces = ml.get(img,max_num=4)
    #check if there is any face
    if len(faces) > 0:
        # sort the array of faces by by size of bounding box
        faces = sorted(faces, key=lambda x: x.bbox[2] * x.bbox[3], reverse=True)
        # get the first face
        face = faces[0]
        #convert the face embedding to a json string
        face_embedding = json.dumps(face.embedding.tolist())
        #save the face embedding to redis with the card id as the key
        r.set(card_id,face_embedding)
        return {"status":"0"}
    else:
        return {"status":"1"}


@app.get("/id")
def read_card_id():
    cardNo=None
    t1=time.time()
    #flush serial buffer
    com_id.ser.reset_input_buffer()
    #loop until a card id is read or 20 seconds have passed
    while cardNo==None and time.time()-t1<20:
        print("waiting for card")
        if com_id.ser.in_waiting>0:
            data = com_id.ser.readline()
            try:
                data = json.loads(data)
                cardNo=data['card']
                return {"card_id":cardNo}
            except:
                raise fastapi.HTTPException(status_code=404, detail="Card number invalid", card_id=None)
        print("card read")
        # send  404 status code if no card id is read
    raise fastapi.HTTPException(status_code=404, detail="Card not scanned", card_id=None)
        




#run the server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)

