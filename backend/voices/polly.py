import os
import boto3
from botocore.exceptions import BotoCoreError, ClientError

# Get AWS credentials from environment (same as S3/DynamoDB)
AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_SESSION_TOKEN = os.getenv("AWS_SESSION_TOKEN")
AWS_REGION = os.getenv("AWS_DEFAULT_REGION", "us-east-1")

def get_polly_client():
    """Initialize Boto3 Polly client."""
    if AWS_ACCESS_KEY and AWS_SECRET_KEY:
        return boto3.client(
            "polly",
            aws_access_key_id=AWS_ACCESS_KEY,
            aws_secret_access_key=AWS_SECRET_KEY,
            aws_session_token=AWS_SESSION_TOKEN,
            region_name=AWS_REGION
        )
    return boto3.client("polly", region_name=AWS_REGION)

def synthesize_speech(text: str, voice_id: str = "Joanna") -> bytes:
    """
    Convert text to speech using Amazon Polly and return audio bytes.
    """
    try:
        polly = get_polly_client()
        
        # Prepare the text (clean it up slightly for better speech)
        # Limiting to 3000 chars as per Polly limits for a single call
        clean_text = text[:2900]
        
        response = polly.synthesize_speech(
            Text=clean_text,
            OutputFormat="mp3",
            VoiceId=voice_id,
            Engine="neural" if voice_id in ["Joanna", "Matthew", "Amy"] else "standard"
        )
        
        if "AudioStream" in response:
            return response["AudioStream"].read()
        return None
        
    except (BotoCoreError, ClientError) as error:
        print(f"❌ Amazon Polly error: {error}")
        return None
    except Exception as e:
        print(f"❌ Unexpected error in Polly synthesis: {e}")
        return None
