FROM python:3.12.8-slim

WORKDIR /app
COPY apps/api ./apps/api
COPY scripts ./scripts
COPY .env.example ./.env.example
EXPOSE 8010

CMD ["python", "apps/api/run.py"]
