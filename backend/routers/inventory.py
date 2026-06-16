from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from datetime import date
from typing import Optional

# ดึงสายเคเบิลระบบฐานข้อมูล โมเดล และตัวเช็กสิทธิ์ JWT ของเรามาใช้งาน
from database import get_db
from models.inventory import InventoryItem
from routers.auth import get_current_user
from models.user import User

router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"]
)

# 📋 1. สร้าง Pydantic Schema สำหรับรับข้อมูลเวลากรอกเพิ่มของด้วยมือ (Manual Input)
class InventoryManualCreate(BaseModel):
    name: str                  # "ไข่ไก่", "หมูสับ"
    quantity: float            # 3, 0.5
    unit: str                  # "ฟอง", "กิโลกรัม"
    category: Optional[str] = "other"  # "protein", "veggie", "dairy" (ถ้าไม่ส่งมา ให้ใส่ 'other')
    expiry_date: Optional[date] = None # วันหมดอายุ (ใส่หรือไม่ใส่ก็ได้ YYYY-MM-DD)
    added_by: Optional[str] = "manual" # แหล่งที่มา เช่น "manual" หรือ "scan"

class InventoryBulkCreate(BaseModel):
    items: list[InventoryManualCreate]

# 📋 2. Schema สำหรับตัวแทนข้อมูลที่ส่งกลับไปหาหน้าเว็บ (Response Model)
class InventoryItemResponse(BaseModel):
    id: int
    user_id: int
    name: str
    quantity: float
    unit: str
    category: Optional[str]
    expiry_date: Optional[date]
    added_by: str

    class Config:
        from_attributes = True # บอกให้ Pydantic สามารถแกะอ่าน Object ของ SQLAlchemy ได้โดยตรง


# 🚀 [ เส้นทาง API: POST /inventory/manual ]
@router.post("/manual", response_model=InventoryItemResponse, status_code=status.HTTP_201_CREATED)
def add_inventory_manual(
    item_data: InventoryManualCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # 🔒 บังคับล็อกอิน! ส่องตั๋ว JWT เอาข้อมูลผู้ใช้ปัจจุบันมาใช้งานทันที
):
    name_clean = item_data.name.strip()
    existing_item = db.query(InventoryItem).filter(
        InventoryItem.user_id == current_user.id,
        func.lower(InventoryItem.name) == name_clean.lower(),
        InventoryItem.unit == item_data.unit
    ).first()

    if existing_item:
        existing_item.quantity += item_data.quantity
        if item_data.expiry_date:
            if not existing_item.expiry_date or item_data.expiry_date < existing_item.expiry_date:
                existing_item.expiry_date = item_data.expiry_date
        db.commit()
        db.refresh(existing_item)
        return existing_item

    # สร้างก้อนข้อมูลเตรียมยัดลงตาราง inventory_items
    new_item = InventoryItem(
        user_id=current_user.id,       # ผูกมัดติดกับไอดีผู้ใช้ที่ล็อกอินอยู่ ณ ตอนนั้นอัตโนมัติ
        name=name_clean,
        quantity=item_data.quantity,
        unit=item_data.unit,
        category=item_data.category,
        expiry_date=item_data.expiry_date,
        added_by=item_data.added_by
    )
    
    db.add(new_item)
    db.commit()
    db.refresh(new_item) # อัปเดตเพื่อดึงเลข id ที่เบสเพิ่งรันออกมาให้
    
    return new_item

# 🚀 [ เส้นทาง API: POST /inventory/bulk ]
@router.post("/bulk", response_model=list[InventoryItemResponse], status_code=status.HTTP_201_CREATED)
def add_inventory_bulk(
    payload: InventoryBulkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    processed_items = []
    for item_data in payload.items:
        name_clean = item_data.name.strip()
        
        # Check if we already have it in the processed list for the current transaction
        temp_item = None
        for p_item in processed_items:
            if p_item.name.lower() == name_clean.lower() and p_item.unit == item_data.unit:
                temp_item = p_item
                break
                
        if temp_item:
            temp_item.quantity += item_data.quantity
            if item_data.expiry_date:
                if not temp_item.expiry_date or item_data.expiry_date < temp_item.expiry_date:
                    temp_item.expiry_date = item_data.expiry_date
            continue
            
        # Check if exists in db
        existing_item = db.query(InventoryItem).filter(
            InventoryItem.user_id == current_user.id,
            func.lower(InventoryItem.name) == name_clean.lower(),
            InventoryItem.unit == item_data.unit
        ).first()

        if existing_item:
            existing_item.quantity += item_data.quantity
            if item_data.expiry_date:
                if not existing_item.expiry_date or item_data.expiry_date < existing_item.expiry_date:
                    existing_item.expiry_date = item_data.expiry_date
            db.add(existing_item)
            processed_items.append(existing_item)
        else:
            new_item = InventoryItem(
                user_id=current_user.id,
                name=name_clean,
                quantity=item_data.quantity,
                unit=item_data.unit,
                category=item_data.category,
                expiry_date=item_data.expiry_date,
                added_by=item_data.added_by
            )
            db.add(new_item)
            processed_items.append(new_item)
    
    db.commit()
    for item in processed_items:
        db.refresh(item)
        
    return processed_items

class InventoryUpdateSchema(BaseModel):
    name: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    category: Optional[str] = None
    expiry_date: Optional[date] = None


# 🚀 [ เส้นทาง API: GET /inventory/ ]
# ดึงรายการวัตถุดิบทั้งหมดที่มีอยู่ในตู้เย็น "เฉพาะของผู้ใช้ที่ล็อกอินอยู่"
@router.get("/", response_model=list[InventoryItemResponse])
def get_all_inventory_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # คัดกรองข้อมูลด้วยเงื่อนไข .filter(InventoryItem.user_id == current_user.id)
    items = db.query(InventoryItem).filter(InventoryItem.user_id == current_user.id).all()
    return items

@router.get("/{item_id}", response_model=InventoryItemResponse, status_code=200) # 💡 แอบระบุ status_code เผื่อไว้ให้ระบบรู้มาตรฐานชัดเจน
def get_inventory_item_by_id(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(InventoryItem).filter(
        InventoryItem.id == item_id, 
        InventoryItem.user_id == current_user.id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="ไม่พบไอเทมวัตถุดิบชิ้นนี้ในตู้เย็นของคุณ")
        
    return item

# 🚀 [ เส้นทาง API: PUT /inventory/{id} ]
# แก้ไข ชื่อ / จำนวน / หน่วย / วันหมดอายุ ของวัตถุดิบชิ้นนั้นๆ
@router.put("/{item_id}", response_model=InventoryItemResponse)
def update_inventory_item(
    item_id: int,
    update_data: InventoryUpdateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. ค้นหาวัตถุดิบชิ้นนั้นในฐานข้อมูล และเช็กด้วยว่าต้องเป็นของ user คนนี้จริงๆ เท่านั้น
    item = db.query(InventoryItem).filter(
        InventoryItem.id == item_id, 
        InventoryItem.user_id == current_user.id
    ).first()
    
    # ถ้าหาไม่เจอ หรือแอบพิมพ์เลข ID ข้ามไปแก้ของตู้เย็นคนอื่น จะเตะส่ง 404 ออกไป
    if not item:
        raise HTTPException(status_code=404, detail="ไม่พบไอเทมวัตถุดิบชิ้นนี้ในตู้เย็นของคุณ")
    
    # 2. ทำการวนลูปเช็กว่า Frontend ส่งฟิลด์ไหนมาแก้บ้าง แล้วอัปเดตทับลงไป
    stored_item_data = update_data.model_dump(exclude_unset=True) # เอาเฉพาะฟิลด์ที่มีการส่งค่ามาจริงๆ
    for key, value in stored_item_data.items():
        setattr(item, key, value)
        
    db.commit()
    db.refresh(item)
    return item


# 🚀 [ เส้นทาง API: DELETE /inventory/{id} ]
# ลบรายการวัตถุดิบชิ้นนั้นออกจากตู้เย็นถาวร
@router.delete("/{item_id}", status_code=status.HTTP_200_OK)
def delete_inventory_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # ค้นหาวัตถุดิบเป้าหมาย
    item = db.query(InventoryItem).filter(
        InventoryItem.id == item_id, 
        InventoryItem.user_id == current_user.id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="ไม่พบไอเทมวัตถุดิบชิ้นนี้ในตู้เย็นของคุณ")
        
    db.delete(item)
    db.commit()
    
    return {"status": "success", "message": f"ลบรายการ '{item.name}' ออกจากตู้เย็นสำเร็จแล้ว"}

# 🚀 [ เส้นทาง API: DELETE /inventory ]
# ลบรายการวัตถุดิบทั้งหมดในตู้เย็นของผู้ใช้ปัจจุบัน
@router.delete("/", status_code=status.HTTP_200_OK)
def delete_all_inventory_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(InventoryItem).filter(InventoryItem.user_id == current_user.id).delete()
    db.commit()
    return {"status": "success", "message": "ลบวัตถุดิบทั้งหมดออกจากตู้เย็นของคุณเรียบร้อยแล้ว"}