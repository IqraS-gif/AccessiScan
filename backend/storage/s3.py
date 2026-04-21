import os
import json
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from dotenv import load_dotenv

load_dotenv()

S3_BUCKET = os.getenv("S3_BUCKET_NAME", "accessiscan-reports")
AWS_REGION = os.getenv("AWS_DEFAULT_REGION", "us-east-1")


def get_s3_client():
    """Get an S3 client. Supports IAM Roles and Environment Variables."""
    try:
        # Check if we have explicit credentials in .env
        access_key = os.getenv("AWS_ACCESS_KEY_ID")
        secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
        session_token = os.getenv("AWS_SESSION_TOKEN")

        if access_key and secret_key:
            print("Using explicit AWS credentials from environment")
            session = boto3.Session(
                aws_access_key_id=access_key,
                aws_secret_access_key=secret_key,
                aws_session_token=session_token,
                region_name=AWS_REGION,
            )
            return session.client("s3")
        else:
            print("No explicit AWS credentials found, attempting to use IAM Role/Default Chain")
            # Default to the environment's IAM role or local AWS config
            return boto3.client("s3", region_name=AWS_REGION)
    except Exception as e:
        print(f"❌ Failed to initialize S3 client: {e}")
        return None



def upload_screenshot(scan_id: str, user_id: str, file_path: str) -> str | None:
    """Upload a screenshot to S3 and return the S3 key."""
    client = get_s3_client()
    if not client:
        print("S3 client unavailable, skipping upload")
        return None

    s3_key = f"reports/{user_id}/{scan_id}/screenshot.png"
    try:
        print(f"Uploading screenshot to S3: {s3_key}")
        client.upload_file(
            file_path,
            S3_BUCKET,
            s3_key,
            ExtraArgs={"ContentType": "image/png"},
        )
        print("✅ Screenshot uploaded successfully")
        return s3_key
    except (ClientError, NoCredentialsError) as e:
        print(f"❌ S3 upload error: {e}")
        return None


def upload_report(scan_id: str, user_id: str, report_data: dict) -> str | None:
    """Upload a JSON report to S3."""
    client = get_s3_client()
    if not client:
        return None

    s3_key = f"reports/{user_id}/{scan_id}/report.json"
    try:
        print(f"Uploading JSON report to S3: {s3_key}")
        client.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=json.dumps(report_data, indent=2),
            ContentType="application/json",
        )
        print("✅ JSON report uploaded successfully")
        return s3_key
    except (ClientError, NoCredentialsError) as e:
        print(f"❌ S3 upload error: {e}")
        return None


def get_presigned_url(s3_key: str, expiration: int = 3600) -> str | None:
    """Generate a presigned URL for an S3 object."""
    client = get_s3_client()
    if not client:
        return None

    try:
        print(f"Generating presigned URL for: {s3_key}")
        url = client.generate_presigned_url(
            "get_object",
            Params={"Bucket": S3_BUCKET, "Key": s3_key},
            ExpiresIn=expiration,
        )
        return url
    except (ClientError, NoCredentialsError) as e:
        print(f"❌ S3 presigned URL error: {e}")
        return None


def upload_pdf(scan_id: str, user_id: str, pdf_bytes: bytes) -> str | None:
    """Upload a PDF report to S3."""
    client = get_s3_client()
    if not client:
        return None

    s3_key = f"reports/{user_id}/{scan_id}/report.pdf"
    try:
        print(f"Uploading PDF report to S3: {s3_key}")
        client.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=pdf_bytes,
            ContentType="application/pdf",
        )
        print("✅ PDF report uploaded successfully")
        return s3_key
    except (ClientError, NoCredentialsError) as e:
        print(f"❌ S3 PDF upload error: {e}")
        return None
