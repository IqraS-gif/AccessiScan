# AccessiScan Restart Guide 🚀

Use this guide if you have made changes to the code or if the servers have stopped.

## 1. Login to your AWS EC2
Open your PowerShell and run:
`ssh -i "C:\Users\iqras\downloads\accessiscan-key.pem" ec2-user@98.80.142.74`

---

## 2. The "Clean Slate" Restart (Recommended)
Run this single block of commands to wipe the old servers and start the new ones:

```bash
# 1. Kill everything
sudo fuser -k 8000/tcp
sudo pkill -f uvicorn
sudo pkill -f serve

# 2. Get the latest code from GitHub
cd ~/AccessiScan
git pull origin main

# 3. Start Backend
cd ~/AccessiScan/backend
source venv/bin/activate
nohup uvicorn main:app --host 0.0.0.0 --port 8000 &

# 4. Start Frontend
cd ~/AccessiScan/frontend
nohup serve -s dist -l 5173 &

# 5. Check if they are running
sleep 2
ps aux | grep -E 'uvicorn|serve'
```

---

## 3. How to Update after Code Changes
Whenever you push new code from your laptop:
1. Run `git pull origin main` on the server.
2. If you changed the **Frontend** (UI/Pages), you MUST run `npm run build` in the `frontend` folder before restarting.

---

## 4. Troubleshooting
- **Dashboard not loading**: Check `tail -n 20 ~/AccessiScan/frontend/nohup.out`
- **Scans failing**: Check `tail -n 20 ~/AccessiScan/backend/nohup.out`
- **401 Error**: Make sure you are using the latest `api/client.js` and have hard-refreshed your browser (Ctrl+F5).
