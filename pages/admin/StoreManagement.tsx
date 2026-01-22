
import React, { useState, useRef } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { StoreProduct, StoreOrder, ProductType } from '../../types';
import { Package, Plus, Edit, Trash2, CheckCircle, XCircle, Search, Upload, X, Image as ImageIcon, Eye, Loader2, Link as LinkIcon, Target, Zap, Filter, ShoppingBag } from 'lucide-react';
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
    const [searchTerm, setSearchTerm] = useState('');
    
    // Product Modal State
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
    const [productForm, setProductForm] = useState<{
        title: string; description: string; type: ProductType; price: number; 
        prevPrice: number; image: string; fileUrl: string; previewUrl: string; stock: number; category: string; targetClass: string;
    }>({
        title: '', description: '', type: 'DIGITAL', price: 0, prevPrice: 0, 
        image: '', fileUrl: '', previewUrl: '', stock: 0, category: '', targetClass: ''
    });
    const [isUploading, setIsUploading] = useState(false);
    
    // Order Action State
    const [confirmOrderModal, setConfirmOrderModal] = useState<{ isOpen: boolean; order: StoreOrder | null; action: 'APPROVE' | 'SHIP' | 'REJECT' }>({ isOpen: false, order: null, action: 'APPROVE' });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const currentUser = authService.getCurrentUser();

    // -- PRODUCTS LOGIC --
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
            if(currentUser) authService.logAdminAction(currentUser.id, currentUser.name, "Updated Product", `Product: ${productData.title}`, "INFO");
        } else {
            setProducts(prev => [productData, ...prev]);
            if(currentUser) authService.logAdminAction(currentUser.id, currentUser.name, "Created Product", `Product: ${productData.title}`, "SUCCESS");
        }
        setIsProductModalOpen(false);
        resetForm();
    };

    const handleDeleteProduct = (id: string) => {
        if(confirm("Are you sure?")) {
            const prodTitle = products.find(p => p.id === id)?.title || id;
            setProducts(prev => prev.filter(p => p.id !== id));
            if(currentUser) authService.logAdminAction(currentUser.id, currentUser.name, "Deleted Product", `Product: ${prodTitle}`, "DANGER");
        }
    };

    const resetForm = () => {
        setProductForm({
            title: '', description: '', type: 'DIGITAL', price: 0, prevPrice: 0, 
            image: '', fileUrl: '', previewUrl: '', stock: 0, category: '', targetClass: ''
        });
        setEditingProduct(null);
    };

    const openEditProduct = (product: StoreProduct) => {
        setEditingProduct(product);
        setProductForm({
            title: product.title,
            description: product.description,
            type: product.type,
            price: product.price,
            prevPrice: product.prevPrice || 0,
            image: product.image,
            fileUrl: product.fileUrl || '',
            previewUrl: product.previewUrl || '',
            stock: product.stock || 0,
            category: product.category || '',
            targetClass: product.targetClass || ''
        });
        setIsProductModalOpen(true);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        // Simulating upload for demo, in real app use Firebase Storage
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setProductForm(prev => ({ ...prev, image: event.target!.result as string }));
                setIsUploading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    // -- ORDERS LOGIC --
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

    // Filter Logic
    const filteredProducts = products.filter(p => (p.title || '').toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredOrders = orders.filter(o => 
        (o.id || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (o.userName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-800">Store Management</h1>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('PRODUCTS')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'PRODUCTS' ? 'bg-white shadow text-indigo-700' : 'text-slate-500'}`}
                    >
                        Products
                    </button>
                    <button 
                        onClick={() => setActiveTab('ORDERS')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'ORDERS' ? 'bg-white shadow text-emerald-700' : 'text-slate-500'}`}
                    >
                        Orders ({orders.filter(o => o.status === 'PENDING').length})
                    </button>
                </div>
            </div>

            {/* SEARCH */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder={activeTab === 'PRODUCTS' ? "Search products..." : "Search orders..."}
                        className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {activeTab === 'PRODUCTS' && (
                    <Button onClick={() => { resetForm(); setIsProductModalOpen(true); }} className="flex items-center">
                        <Plus size={18} className="mr-2" /> Add Product
                    </Button>
                )}
            </div>

            {/* PRODUCTS TAB */}
            {activeTab === 'PRODUCTS' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredProducts.map(product => (
                        <Card key={product.id} className="p-4 flex flex-col relative group">
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 p-1 rounded-lg shadow-sm">
                                <button onClick={() => openEditProduct(product)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"><Edit size={16} /></button>
                                <button onClick={() => handleDeleteProduct(product.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                            </div>
                            <img src={product.image} className="w-full h-40 object-cover rounded-lg bg-slate-100 mb-3" alt="cover" />
                            <h3 className="font-bold text-slate-800 line-clamp-1">{product.title}</h3>
                            <div className="flex justify-between items-center mt-auto pt-3">
                                <Badge color="bg-slate-100 text-slate-600">{product.type}</Badge>
                                <span className="font-bold text-indigo-700">৳{product.price}</span>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* ORDERS TAB */}
            {activeTab === 'ORDERS' && (
                <div className="space-y-4">
                    {filteredOrders.length === 0 && <div className="text-center py-10 text-slate-400">No orders found.</div>}
                    {filteredOrders.map(order => (
                        <Card key={order.id} className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-l-4 ${order.status === 'PENDING' ? 'border-l-amber-500' : order.status === 'COMPLETED' ? 'border-l-emerald-500' : 'border-l-slate-300'}`}>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Badge color={
                                        order.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                        order.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                        order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                                    }>
                                        {order.status}
                                    </Badge>
                                    <span className="text-xs text-slate-400 font-mono">#{order.id.substring(4, 10).toUpperCase()}</span>
                                </div>
                                <h3 className="font-bold text-slate-800">{order.productTitle}</h3>
                                <p className="text-sm text-slate-500">
                                    User: <span className="font-medium text-slate-700">{order.userName}</span> • {order.userPhone}
                                </p>
                                <div className="text-xs text-slate-400 mt-1 flex gap-3">
                                    <span>Method: {order.method}</span>
                                    <span>TrxID: {order.trxId}</span>
                                    <span>Amount: ৳{order.amount}</span>
                                </div>
                                {order.address && (
                                    <div className="mt-2 text-xs bg-slate-50 p-2 rounded border border-slate-200">
                                        <span className="font-bold">Shipping:</span> {order.address}
                                    </div>
                                )}
                            </div>
                            
                            {order.status === 'PENDING' && (
                                <div className="flex flex-col gap-2 min-w-[120px]">
                                    {order.productType === 'PHYSICAL' ? (
                                        <Button size="sm" onClick={() => setConfirmOrderModal({ isOpen: true, order, action: 'SHIP' })}>Ship Order</Button>
                                    ) : (
                                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setConfirmOrderModal({ isOpen: true, order, action: 'APPROVE' })}>Approve</Button>
                                    )}
                                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setConfirmOrderModal({ isOpen: true, order, action: 'REJECT' })}>Reject</Button>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            {/* PRODUCT MODAL */}
            <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title={editingProduct ? "Edit Product" : "New Product"} size="lg">
                 <form onSubmit={handleProductSubmit} className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                         <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                             <input required type="text" className="w-full p-2 border rounded-lg" value={productForm.title} onChange={e => setProductForm({...productForm, title: e.target.value})} />
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                             <select className="w-full p-2 border rounded-lg" value={productForm.type} onChange={e => setProductForm({...productForm, type: e.target.value as ProductType})}>
                                 <option value="DIGITAL">Digital (PDF)</option>
                                 <option value="PHYSICAL">Physical (Book)</option>
                             </select>
                         </div>
                     </div>
                     
                     <div className="grid grid-cols-3 gap-4">
                         <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Price (৳)</label>
                             <input required type="number" className="w-full p-2 border rounded-lg" value={productForm.price} onChange={e => setProductForm({...productForm, price: Number(e.target.value)})} />
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">Previous Price</label>
                             <input type="number" className="w-full p-2 border rounded-lg" value={productForm.prevPrice} onChange={e => setProductForm({...productForm, prevPrice: Number(e.target.value)})} />
                         </div>
                         {productForm.type === 'PHYSICAL' && (
                             <div>
                                 <label className="block text-sm font-medium text-slate-700 mb-1">Stock</label>
                                 <input type="number" className="w-full p-2 border rounded-lg" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: Number(e.target.value)})} />
                             </div>
                         )}
                     </div>

                     <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                         <textarea className="w-full p-2 border rounded-lg h-20" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} />
                     </div>

                     <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Image (Upload or URL)</label>
                         <div className="flex gap-2">
                             <input type="text" className="flex-1 p-2 border rounded-lg" placeholder="https://..." value={productForm.image} onChange={e => setProductForm({...productForm, image: e.target.value})} />
                             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                             <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                                 {isUploading ? <Loader2 className="animate-spin"/> : <Upload size={16}/>}
                             </Button>
                         </div>
                     </div>

                     {productForm.type === 'DIGITAL' && (
                         <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1">File URL (PDF Link)</label>
                             <input type="text" className="w-full p-2 border rounded-lg" placeholder="https://drive.google.com/..." value={productForm.fileUrl} onChange={e => setProductForm({...productForm, fileUrl: e.target.value})} />
                         </div>
                     )}

                     {/* Target Class Selection */}
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Target Audience</label>
                        <select 
                            className="w-full p-2 border rounded-lg bg-white"
                            value={productForm.targetClass}
                            onChange={e => setProductForm({...productForm, targetClass: e.target.value})}
                        >
                            <option value="">General / All</option>
                            <optgroup label="Regular">
                                {educationLevels?.REGULAR.map(c => <option key={c} value={c}>{c}</option>)}
                            </optgroup>
                            <optgroup label="Admission">
                                {educationLevels?.ADMISSION.map(c => <option key={c} value={c}>{c}</option>)}
                            </optgroup>
                        </select>
                     </div>

                     <div className="flex justify-end pt-4">
                         <Button type="submit">Save Product</Button>
                     </div>
                 </form>
            </Modal>

            <Modal isOpen={confirmOrderModal.isOpen} onClose={() => setConfirmOrderModal({ ...confirmOrderModal, isOpen: false })} title="Confirm Order Action">
                 <div className="space-y-4">
                     <p className="text-slate-600">
                         Are you sure you want to <strong>{confirmOrderModal.action}</strong> this order?
                         {confirmOrderModal.action === 'APPROVE' && " This will grant user access to the content."}
                     </p>
                     <div className="flex justify-end gap-2 pt-2">
                         <Button variant="outline" onClick={() => setConfirmOrderModal({ ...confirmOrderModal, isOpen: false })}>Cancel</Button>
                         <Button onClick={handleOrderAction} className={confirmOrderModal.action === 'REJECT' ? "bg-red-600" : "bg-emerald-600"}>Confirm</Button>
                     </div>
                 </div>
            </Modal>
        </div>
    );
};

export default StoreManagement;
