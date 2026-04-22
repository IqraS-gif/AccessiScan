# 🚀 AccessiScan: Master Startup Guide (AWS)
Follow these steps exactly, from start to finish, every time you start a new AWS session.

## Phase 1: AWS Preparation (The "Keys")
1. **Start Lab**: Go to your AWS Academy Learner Lab and click **Start Lab**.
2. **Get Credentials**: Click **AWS Details**, then copy the **Access Key**, **Secret Key**, and **Session Token**.
3. **Start EC2**: Go to the EC2 Console, select your instance, and click **Instance State** -> **Start**.
4. **Copy IP**: Copy the **Public IPv4 address** (e.g., `98.80.142.74`).

---

## Phase 2: Connecting (The "SSH")
Open your local **PowerShell** on your laptop and run this command:

```powershell
# REPLACE 'YOUR_NEW_IP' with the IP you just copied!
ssh -i "C:\Users\iqras\downloads\accessiscan-key.pem" ec2-user@YOUR_NEW_IP
```

---

## Phase 3: Configuration (Inside SSH)
Once you are logged into the EC2 instance, you must update your environment variables:

### 1. Update Backend Credentials & IP
```bash
nano ~/AccessiScan/backend/.env
```
- **Step**: Paste your new **Access Key**, **Secret Key**, and **Session Token**.
- **Step**: Update `FRONTEND_URL=http://YOUR_NEW_IP:5173`.
- **Step (Optional)**: Update `SNS_TOPIC_ARN` if you created a new topic.
- **Save & Exit**: Press `Ctrl + O`, then `Enter`, then `Ctrl + X`.

### 2. Update Frontend IP
```bash
nano ~/AccessiScan/frontend/.env
```
- **Step**: Update `VITE_API_URL=http://YOUR_NEW_IP:8000`.
- **Save & Exit**: Press `Ctrl + O`, then `Enter`, then `Ctrl + X`.

> [!NOTE]
> You no longer need to manually edit `main.py`! The code now automatically reads the IP from your `.env` file.

---

## Phase 4: The Clean Start
Copy and paste this entire block into your SSH terminal:

```bash
# 1. Force-clear port 8000 and kill old versions
sudo fuser -k 8000/tcp
sudo pkill -f uvicorn
sudo pkill -f serve

# 2. Get latest code changes (if any)
cd ~/AccessiScan
git pull origin main

# 3. Re-build the Frontend (Required for UI/IP changes)
cd ~/AccessiScan/frontend
npm run build

# 4. Start Backend on Port 8000
cd ~/AccessiScan/backend
source venv/bin/activate
nohup uvicorn main:app --host 0.0.0.0 --port 8000 &

# 5. Start Frontend on Port 5173
cd ~/AccessiScan/frontend
nohup serve -s dist -l 5173 &
```

---

## Phase 5: Verification
1. In your laptop browser, go to: `http://YOUR_NEW_IP:5173`.
2. **Dashboard**: You should see the dashboard immediately (Login is bypassed for easy demo!). ✅
3. **Verify Scans**: Run a new scan and verify you receive an **Email Notification** (if SNS is configured).

---

## 🆘 Troubleshooting
If you see "No scans yet" or a connection error:
1. **Hard Refresh**: Press `Ctrl + F5` to clear your browser cache.
2. **Check Logs**: Run `tail -n 20 ~/AccessiScan/backend/nohup.out` to check for expired AWS tokens.
3. **Port Check**: Run `sudo lsof -i :8000` to ensure the API is listening.
