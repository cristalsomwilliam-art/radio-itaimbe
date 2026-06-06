import urllib.request
import json

url = "https://jxrijcrnlsfcyywfggyr.supabase.co/rest/v1/social_stream_config?select=*"
req = urllib.request.Request(url)
req.add_header("apikey", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4cmlqY3JubHNmY3l5d2ZnZ3lyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDU4ODkyOSwiZXhwIjoyMDk2MTY0OTI5fQ.AaQoeGZ8XBiIWrPxCO5rxyQ4XAauhbGmZQPbEQAytSw")
req.add_header("Authorization", "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4cmlqY3JubHNmY3l5d2ZnZ3lyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDU4ODkyOSwiZXhwIjoyMDk2MTY0OTI5fQ.AaQoeGZ8XBiIWrPxCO5rxyQ4XAauhbGmZQPbEQAytSw")

try:
    with urllib.request.urlopen(req) as response:
        html = response.read()
        print("Status: 200")
        print("Data:", json.loads(html.decode('utf-8')))
except Exception as e:
    print("Error:", e)
