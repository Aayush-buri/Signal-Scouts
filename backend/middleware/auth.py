from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import jwt
from config import settings

security = HTTPBearer()


class AuthMiddleware:
    """
    Authentication middleware using JWT tokens
    
    In production, integrate with NextAuth.js JWT tokens or Auth0
    """
    
    @staticmethod
    def verify_token(token: str) -> dict:
        """
        Verify JWT token and extract payload
        
        Args:
            token: JWT token string
            
        Returns:
            Decoded token payload
            
        Raises:
            HTTPException: If token is invalid
        """
        try:
            payload = jwt.decode(
                token,
                settings.secret_key,
                algorithms=["HS256"]
            )
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
    
    @staticmethod
    async def get_current_user(
        credentials: HTTPAuthorizationCredentials = security
    ) -> dict:
        """
        Dependency to get current user from token
        
        Usage:
            @router.get("/protected")
            async def protected_route(user: dict = Depends(AuthMiddleware.get_current_user)):
                return {"user_id": user["sub"]}
        """
        token = credentials.credentials
        return AuthMiddleware.verify_token(token)
    
    @staticmethod
    async def get_current_user_optional(
        request: Request
    ) -> Optional[dict]:
        """
        Optional authentication - doesn't fail if no token present
        """
        auth_header = request.headers.get("Authorization")
        
        if not auth_header:
            return None
        
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                return None
            
            return AuthMiddleware.verify_token(token)
        except Exception:
            return None
    
    @staticmethod
    def require_admin(user: dict) -> bool:
        """
        Check if user has admin role
        
        Args:
            user: User payload from token
            
        Returns:
            True if admin, raises exception otherwise
        """
        if user.get("role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )
        return True
