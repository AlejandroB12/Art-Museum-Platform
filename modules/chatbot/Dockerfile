FROM python:3.12-slim
WORKDIR /app
COPY modules/chatbot/src/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY modules/chatbot/src/ ./modules/chatbot/src/
EXPOSE 3006
CMD ["uvicorn", "modules.chatbot.src.main:app", "--host", "0.0.0.0", "--port", "3006"]
