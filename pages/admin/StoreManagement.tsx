
import React, { useState, useRef } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { StoreProduct, StoreOrder, ProductType } from '../../types';
import { Package, Plus, Edit, Trash2, CheckCircle, XCircle, Search, Upload, X, Image as ImageIcon, Eye, Loader2, Link as LinkIcon, Target, Zap, Filter } from 'lucide-react';
import { db, storage } from '../../services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { authService } from '../../services/authService';

interface Props {
    products: StoreProduct[];
    setProducts: React.Dispatch<React.SetStateAction<StoreProduct[]>>;
    orders: StoreOrder[];
    setOrders: React.Dispatch<React.SetStateAction<StoreOrder[]>>;
    educationLevels?: { REGULAR: string[], ADMISSION: string[] }; 
}

const StoreManagement: React.FC<Props> = ({ products, setProducts, orders, setOrders, educationLevels }) => {
    const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'ORDERS'>('PRODUCTS');
    // ... (other state)
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
    const [productForm, setProductForm] = useState<{
        title: string; description: string; type: ProductType; price: number; 
        prevPrice: number; image: string; fileUrl: string; previewUrl: string; stock: number; category: string; targetClass: string;
    }>({
        title: '', description: '', type: 'DIGITAL', price: 0, prevPrice: 0, 
        image: '', fileUrl: '', previewUrl: '', stock: 0, category: '', targetClass: ''
    });
    const [confirmOrderModal, setConfirmOrderModal] = useState<{ isOpen: boolean; order: StoreOrder | null; action: 'APPROVE' | 'SHIP' | 'REJECT' }>({ isOpen: false, order: null, action: 'APPROVE' });

    const currentUser = authService.getCurrentUser();

    // ... (Handlers)

    const handleProductSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const productData: StoreProduct = {
            id: editingProduct ? editingProduct.id : `prod_${Date.now()}`,
            ...productForm,
            targetClass: productForm.targetClass || undefined, 
            isFree: productForm.price === 0
        };

        if (editingProduct) {
            setProducts(prev => prev.map(p => p.id === editingProduct.id ? productData : p));
            // LOGGING ADDED
            if(currentUser) authService.logAdminAction(currentUser.id, currentUser.name, "Updated Product", `Product: ${productData.title}`, "INFO");
        } else {
            setProducts(prev => [productData, ...prev]);
            // LOGGING ADDED
            if(currentUser) authService.logAdminAction(currentUser.id, currentUser.name, "Created Product", `Product: ${productData.title}`, "SUCCESS");
        }
        setIsProductModalOpen(false);
        // resetForm(); // Call internal reset
    };

    const handleDeleteProduct = (id: string) => {
        if(confirm("Are you sure?")) {
            const prodTitle = products.find(p => p.id === id)?.title || id;
            setProducts(prev => prev.filter(p => p.id !== id));
            // LOGGING ADDED
            if(currentUser) authService.logAdminAction(currentUser.id, currentUser.name, "Deleted Product", `Product: ${prodTitle}`, "DANGER");
        }
    };

    const handleOrderAction = async () => {
        if (!confirmOrderModal.order) return;
        const { order, action } = confirmOrderModal;
        
        let newStatus: StoreOrder['status'] = 'PENDING';
        if (action === 'APPROVE') newStatus = 'COMPLETED'; 
        if (action === 'SHIP') newStatus = 'SHIPPED'; 
        if (action === 'REJECT') newStatus = 'REJECTED';

        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o));
        
        try {
            await setDoc(doc(db, "store_orders", order.id), { status: newStatus }, { merge: true });
            
            // LOGGING ADDED
            if (currentUser) {
                authService.logAdminAction(
                    currentUser.id, 
                    currentUser.name, 
                    `${action} Order`, 
                    `Order #${order.id.substring(4,9)} | User: ${order.userName}`, 
                    action === 'REJECT' ? "WARNING" : "SUCCESS"
                );
            }

        } catch(e) { console.error(e); }

        setConfirmOrderModal({ isOpen: false, order: null, action: 'APPROVE' });
    };

    // ... (Render Logic same as before)
    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* UI Code */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Store Management</h1>
                {/* ... Tabs ... */}
            </div>
            
            {/* ... Modal and Tables ... */}
            <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title="Product Editor" size="lg">
                 {/* ... Form ... */}
                 <form onSubmit={handleProductSubmit} className="space-y-4">
                     {/* ... Fields ... */}
                     <div className="flex justify-end pt-4"><Button type="submit">Save Product</Button></div>
                 </form>
            </Modal>

            <Modal isOpen={confirmOrderModal.isOpen} onClose={() => setConfirmOrderModal({ ...confirmOrderModal, isOpen: false })} title="Confirm Order Action">
                 {/* ... Modal Content ... */}
                 <div className="flex justify-end gap-2 pt-2">
                     <Button variant="outline" onClick={() => setConfirmOrderModal({ ...confirmOrderModal, isOpen: false })}>Cancel</Button>
                     <Button onClick={handleOrderAction}>Confirm</Button>
                 </div>
            </Modal>
        </div>
    );
};

export default StoreManagement;
