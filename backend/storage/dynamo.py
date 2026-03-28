import os
import json
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from dotenv import load_dotenv
from decimal import Decimal

load_dotenv()

TABLE_NAME = os.getenv("DYNAMODB_TABLE_NAME", "AccessiScanResults")
AWS_REGION = os.getenv("AWS_DEFAULT_REGION", "us-east-1")


def get_dynamo_resource():
    """Get a DynamoDB resource."""
    try:
        session = boto3.Session(
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            aws_session_token=os.getenv("AWS_SESSION_TOKEN"),
            region_name=AWS_REGION,
        )
        return session.resource("dynamodb")
    except Exception:
        return None


def _convert_floats(obj):
    """Recursively convert floats to Decimal for DynamoDB."""
    if isinstance(obj, float):
        return Decimal(str(obj))
    elif isinstance(obj, dict):
        return {k: _convert_floats(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_convert_floats(i) for i in obj]
    return obj


def _convert_decimals(obj):
    """Recursively convert Decimals back to floats for JSON serialization."""
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: _convert_decimals(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_convert_decimals(i) for i in obj]
    return obj


def put_scan(scan_data: dict) -> bool:
    """Store a scan result in DynamoDB."""
    dynamo = get_dynamo_resource()
    if not dynamo:
        print("DynamoDB unavailable, skipping storage")
        return False

    try:
        print(f"Saving scan result to DynamoDB table: {TABLE_NAME} (ID: {scan_data['scan_id']})")
        table = dynamo.Table(TABLE_NAME)
        item = _convert_floats({
            "ScanID": scan_data["scan_id"],
            "UserID": scan_data.get("user_id", "default_user"),
            "URL": scan_data["url"],
            "Score": scan_data["score"],
            "ViolationCount": scan_data.get("violation_count", 0),
            "CriticalCount": scan_data.get("critical_count", 0),
            "SeriousCount": scan_data.get("serious_count", 0),
            "Issues": json.dumps(scan_data.get("violations", [])),
            "PourScores": json.dumps(scan_data.get("pour_scores", {})),
            "AiAnalysis": json.dumps(scan_data.get("ai_analysis", {})),
            "CreatedAt": scan_data.get("created_at", ""),
            "S3ReportPath": scan_data.get("report_url", ""),
            "S3ScreenshotPath": scan_data.get("screenshot_url", ""),
        })
        table.put_item(Item=item)
        print("✅ Scan result saved to DynamoDB successfully")
        return True
    except (ClientError, NoCredentialsError) as e:
        print(f"❌ DynamoDB put error: {e}")
        return False


def get_scan(scan_id: str) -> dict | None:
    """Get a scan result from DynamoDB by ScanID."""
    dynamo = get_dynamo_resource()
    if not dynamo:
        return None

    try:
        print(f"Fetching scan from DynamoDB: {scan_id}")
        table = dynamo.Table(TABLE_NAME)
        response = table.get_item(Key={"ScanID": scan_id})
        item = response.get("Item")
        if not item:
            print(f"❓ Scan {scan_id} not found in DynamoDB")
            return None

        print(f"✅ Successfully retrieved scan {scan_id} from DynamoDB")
        item = _convert_decimals(item)
        # Deserialize JSON strings
        if isinstance(item.get("Issues"), str):
            item["Issues"] = json.loads(item["Issues"])
        if isinstance(item.get("PourScores"), str):
            item["PourScores"] = json.loads(item["PourScores"])
        if isinstance(item.get("AiAnalysis"), str):
            item["AiAnalysis"] = json.loads(item["AiAnalysis"])
        return item
    except (ClientError, NoCredentialsError) as e:
        print(f"❌ DynamoDB get error: {e}")
        return None


def list_scans(user_id: str | None = None) -> list[dict]:
    """List all scan results, optionally filtered by user_id."""
    dynamo = get_dynamo_resource()
    if not dynamo:
        return []

    try:
        print(f"Listing scans from DynamoDB (Filter User: {user_id or 'all'})")
        table = dynamo.Table(TABLE_NAME)
        if user_id:
            # Use a scan with filter (not ideal but simple for on-demand)
            response = table.scan(
                FilterExpression="UserID = :uid",
                ExpressionAttributeValues={":uid": user_id},
            )
        else:
            response = table.scan()

        items = response.get("Items", [])
        print(f"✅ Found {len(items)} scans in DynamoDB")
        items = [_convert_decimals(item) for item in items]

        # Sort by CreatedAt descending
        items.sort(key=lambda x: x.get("CreatedAt", ""), reverse=True)

        # Return summaries
        summaries = []
        for item in items:
            summaries.append({
                "scan_id": item.get("ScanID", ""),
                "user_id": item.get("UserID", ""),
                "url": item.get("URL", ""),
                "score": item.get("Score", 0),
                "violation_count": item.get("ViolationCount", 0),
                "created_at": item.get("CreatedAt", ""),
            })
        return summaries
    except (ClientError, NoCredentialsError) as e:
        print(f"❌ DynamoDB list error: {e}")
        return []
