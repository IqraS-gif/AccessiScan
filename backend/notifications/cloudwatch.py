import os
import boto3
from datetime import datetime

# AWS credentials from environment
AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_SESSION_TOKEN = os.getenv("AWS_SESSION_TOKEN")
AWS_REGION = os.getenv("AWS_DEFAULT_REGION", "us-east-1")

def get_cw_client():
    if AWS_ACCESS_KEY and AWS_SECRET_KEY:
        return boto3.client(
            "cloudwatch",
            aws_access_key_id=AWS_ACCESS_KEY,
            aws_secret_access_key=AWS_SECRET_KEY,
            aws_session_token=AWS_SESSION_TOKEN,
            region_name=AWS_REGION
        )
    return boto3.client("cloudwatch", region_name=AWS_REGION)

def report_scan_metrics(scan_result: dict):
    """
    Sends custom metrics to CloudWatch Missions Control:
    - ScanCompleted: Count of 1
    - ViolationCount: Number of issues found
    - AuditScore: The overall accessibility score
    """
    try:
        cw = get_cw_client()
        timestamp = datetime.utcnow()
        
        cw.put_metric_data(
            Namespace="AccessiScan/Audits",
            MetricData=[
                {
                    "MetricName": "ScanCompleted",
                    "Timestamp": timestamp,
                    "Value": 1,
                    "Unit": "Count"
                },
                {
                    "MetricName": "ViolationCount",
                    "Timestamp": timestamp,
                    "Value": scan_result.get("violation_count", 0),
                    "Unit": "Count"
                },
                {
                    "MetricName": "AuditScore",
                    "Timestamp": timestamp,
                    "Value": scan_result.get("score", 0),
                    "Unit": "None"
                }
            ]
        )
        print("✅ Custom metrics pushed to CloudWatch")
    except Exception as e:
        print(f"❌ CloudWatch Metric Error: {e}")
