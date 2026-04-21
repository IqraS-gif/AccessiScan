import os
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from dotenv import load_dotenv

load_dotenv()

SNS_TOPIC_ARN = os.getenv("SNS_TOPIC_ARN")
AWS_REGION = os.getenv("AWS_DEFAULT_REGION", "us-east-1")


def get_sns_client():
    """Get an SNS client using explicit or environment credentials."""
    try:
        access_key = os.getenv("AWS_ACCESS_KEY_ID")
        secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
        session_token = os.getenv("AWS_SESSION_TOKEN")

        if access_key and secret_key:
            session = boto3.Session(
                aws_access_key_id=access_key,
                aws_secret_access_key=secret_key,
                aws_session_token=session_token,
                region_name=AWS_REGION,
            )
            return session.client("sns")
        else:
            return boto3.client("sns", region_name=AWS_REGION)
    except Exception as e:
        print(f"❌ Failed to initialize SNS client: {e}")
        return None


def send_scan_notification(scan_data: dict):
    """
    Publish a notification to SNS when a scan is completed.
    
    Args:
        scan_data: The dictionary containing scan_id, url, score, etc.
    """
    if not SNS_TOPIC_ARN:
        print("⚠️ SNS_TOPIC_ARN not set. Skipping notification.")
        return False

    client = get_sns_client()
    if not client:
        return False

    try:
        url = scan_data.get("url", "Unknown")
        score = scan_data.get("score", 0)
        scan_id = scan_data.get("scan_id")
        violation_count = scan_data.get("violation_count", 0)

        subject = f"🚀 AccessiScan Complete: {url}"
        message = (
            f"Hello!\n\n"
            f"The accessibility scan for {url} is complete.\n\n"
            f"📊 Overall Score: {score}/100\n"
            f"⚠️ Issues Found: {violation_count}\n"
            f"🆔 Scan ID: {scan_id}\n\n"
            f"You can view the full report on your dashboard.\n\n"
            f"Best regards,\n"
            f"AccessiScan Cloud Monitor"
        )

        print(f"📡 Publishing SNS notification for scan {scan_id}...")
        response = client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Message=message,
            Subject=subject
        )
        print(f"✅ SNS Notification sent successfully! MessageId: {response.get('MessageId')}")
        return True

    except (ClientError, NoCredentialsError) as e:
        print(f"❌ SNS Publish error: {e}")
        return False
