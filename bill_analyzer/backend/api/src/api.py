# Created by Metrum AI for Dell
"""FastAPI application for managing bill analysis workflow."""
import time

import requests
from auth.auth_service import AuthService
from auth.utils import configure_logger, handle_exceptions
from fastapi import (
    Depends,
    FastAPI,
    File,
    HTTPException,
    Request,
    UploadFile,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from prefect.client.orchestration import get_client
from prefect_client_func import (
    fetch_artifact_data,
    fetch_replica_ids,
    fetch_task_status,
    start_analysis_runs,
)

logger = configure_logger("Legislative Analysis")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")
auth_service = AuthService(logger, oauth2_scheme)
app = FastAPI(title="Bill Analysis API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/auth/register", tags=["Authentication"])
@handle_exceptions
async def register_user(form: OAuth2PasswordRequestForm = Depends()):
    """Register a new user."""
    auth_service.register_user(form.username, form.password)
    return {"detail": "User registered successfully"}


@app.post("/auth/token", tags=["Authentication"])
@handle_exceptions
async def get_token(form: OAuth2PasswordRequestForm = Depends()):
    """Generate a token for valid credentials."""
    if auth_service.validate_credentials(form.username, form.password):
        logger.info("Received request for token for user: %s", form.username)
        token = auth_service.generate_token(form.username)
        logger.info("Generated token for user: %s", form.username)
        return {"access_token": token, "token_type": "bearer"}
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized"
    )


@app.post("/auth/logout", tags=["Authentication"])
@auth_service.requires_auth
@handle_exceptions
async def logout(request: Request):
    """Logout the user by invalidating the token."""
    token = await oauth2_scheme(request)
    username = auth_service.get_username_from_token(token)
    logger.info("Received request to logout for user: %s", username)
    auth_service.invalidate_token(token)
    logger.info("Logged out successfully for user: %s", username)
    return {"detail": "Logged out successfully"}


@app.post("/auth/change-password", tags=["Authentication"])
@auth_service.requires_auth
@handle_exceptions
async def change_password(
    request: Request, form: OAuth2PasswordRequestForm = Depends()
):
    """Change the user's password."""
    token = await oauth2_scheme(request)
    username = auth_service.get_username_from_token(token)
    auth_service.change_password(username, form.password)
    return {"detail": "Password changed successfully"}


@app.post("/start_runs", tags=["Bill Analyzer"])
@auth_service.requires_auth
@handle_exceptions
async def start_runs(
    request: Request, replicas: int, bill: UploadFile = File(...)
):
    """Start analysis runs for a bill."""
    try:
        async with get_client() as client:
            return await start_analysis_runs(client, bill, replicas)
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Error starting flow: {str(exc)}"
        ) from exc


@app.get("/get_replica_ids", tags=["Bill Analyzer"])
@auth_service.requires_auth
@handle_exceptions
async def get_replica_ids(request: Request, flow_run_id: str):
    """Get IDs of replica runs for a flow."""
    time.sleep(5)
    try:
        return fetch_replica_ids(flow_run_id)
    except requests.exceptions.RequestException as req_err:
        raise HTTPException(
            status_code=500, detail=f"Request error occurred: {str(req_err)}"
        ) from req_err


@app.get("/get_status", tags=["Bill Analyzer"])
@auth_service.requires_auth
@handle_exceptions
async def get_status(request: Request, flow_run_id: str):
    """Get status of all tasks in a flow run."""
    try:
        return fetch_task_status(flow_run_id)
    except requests.exceptions.RequestException as req_err:
        raise HTTPException(
            status_code=500, detail=f"Request error occurred: {str(req_err)}"
        ) from req_err


@app.get("/get_output", tags=["Bill Analyzer"])
@auth_service.requires_auth
@handle_exceptions
async def get_artifact(request: Request, key: str):
    """Get the latest artifact data for a key."""
    try:
        return fetch_artifact_data(key)
    except requests.exceptions.RequestException as req_err:
        raise HTTPException(
            status_code=500, detail=f"Request error occurred: {str(req_err)}"
        ) from req_err
