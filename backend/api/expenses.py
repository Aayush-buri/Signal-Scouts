from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from db.database import get_db
from db.models import Expense
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, datetime
from decimal import Decimal

router = APIRouter(prefix="/api/v1/expenses", tags=["Expenses"])


class ExpenseInput(BaseModel):
    """Input for creating an expense"""
    amount: Decimal = Field(..., gt=0, max_digits=10, decimal_places=2)
    category: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    expense_date: date


class ExpenseResponse(BaseModel):
    """Expense response model"""
    id: str
    user_id: str
    amount: Decimal
    category: Optional[str]
    description: Optional[str]
    expense_date: date
    created_at: datetime
    
    class Config:
        from_attributes = True


class ExpenseSummary(BaseModel):
    """Summary statistics for expenses"""
    total_amount: Decimal
    expense_count: int
    average_amount: Decimal
    by_category: dict


@router.post("/", response_model=ExpenseResponse)
async def create_expense(
    expense: ExpenseInput,
    user_id: str = Query(..., description="User ID from auth token"),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new expense entry
    
    NOTE: In production, user_id should come from authenticated session,
    not query parameter. This is simplified for demonstration.
    """
    new_expense = Expense(
        user_id=user_id,
        amount=expense.amount,
        category=expense.category,
        description=expense.description,
        expense_date=expense.expense_date
    )
    
    db.add(new_expense)
    await db.commit()
    await db.refresh(new_expense)
    
    return ExpenseResponse.model_validate(new_expense)


@router.get("/", response_model=List[ExpenseResponse])
async def get_expenses(
    user_id: str = Query(..., description="User ID from auth token"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category: Optional[str] = None,
    limit: int = Query(50, le=100),
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """
    Get user's expenses with optional filters
    """
    query = select(Expense).where(Expense.user_id == user_id)
    
    if start_date:
        query = query.where(Expense.expense_date >= start_date)
    if end_date:
        query = query.where(Expense.expense_date <= end_date)
    if category:
        query = query.where(Expense.category == category)
    
    query = query.order_by(Expense.expense_date.desc()).limit(limit).offset(offset)
    
    result = await db.execute(query)
    expenses = result.scalars().all()
    
    return [ExpenseResponse.model_validate(exp) for exp in expenses]


@router.get("/summary", response_model=ExpenseSummary)
async def get_expense_summary(
    user_id: str = Query(..., description="User ID from auth token"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Get expense summary statistics
    """
    query = select(
        func.sum(Expense.amount).label("total"),
        func.count(Expense.id).label("count"),
        func.avg(Expense.amount).label("average")
    ).where(Expense.user_id == user_id)
    
    if start_date:
        query = query.where(Expense.expense_date >= start_date)
    if end_date:
        query = query.where(Expense.expense_date <= end_date)
    
    result = await db.execute(query)
    row = result.first()
    
    # Get by category
    category_query = select(
        Expense.category,
        func.sum(Expense.amount).label("total")
    ).where(Expense.user_id == user_id)
    
    if start_date:
        category_query = category_query.where(Expense.expense_date >= start_date)
    if end_date:
        category_query = category_query.where(Expense.expense_date <= end_date)
    
    category_query = category_query.group_by(Expense.category)
    
    category_result = await db.execute(category_query)
    by_category = {cat: float(total) for cat, total in category_result}
    
    return ExpenseSummary(
        total_amount=row.total or 0,
        expense_count=row.count or 0,
        average_amount=row.average or 0,
        by_category=by_category
    )


@router.delete("/{expense_id}")
async def delete_expense(
    expense_id: str,
    user_id: str = Query(..., description="User ID from auth token"),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete an expense (only if it belongs to the user)
    """
    query = select(Expense).where(
        Expense.id == expense_id,
        Expense.user_id == user_id
    )
    
    result = await db.execute(query)
    expense = result.scalars().first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    await db.delete(expense)
    await db.commit()
    
    return {"message": "Expense deleted successfully"}
