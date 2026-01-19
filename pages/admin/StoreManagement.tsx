import React, { useState } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { StoreProduct, StoreOrder, ProductType } from '../../types';
import { Package, Plus, ShoppingBag, Edit, Trash2, CheckCircle, XCircle, Search, Truck, Download, AlertTriangle, Upload, X, Image as ImageIcon } from 'lucide-react';
import { db } from '../../services/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface Props {
    products: StoreProduct[];
    setProducts: React.Dispatch<React.SetStateAction<StoreProduct[]>>;
    orders: StoreOrder[];
    setOrders: React.Dispatch<React.SetStateAction<StoreOrder[]>>;
}

const StoreManagement: React.FC<Props> = ({ products, setProducts, orders, setOrders }) => {
    const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'ORDERS'>('PRODUCTS');
    const [searchTerm, setSearchTerm] = useState('');

    // --- PRODUCT MANAGEMENT STATE ---
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
    const [productForm, setProductForm] = useState<{
        title: string; description: string; type: ProductType; price: number; 
        prevPrice: number; image: string; fileUrl: string; previewUrl: string; stock: number; category: string;
    }>({
        title: '', description: '', type: 'DIGITAL', price: 0, prevPrice: 0, 
        image: '', fileUrl: '', previewUrl: '', stock: 0, category: ''
    });

    // --- ORDER CONFIRMATION STATE ---
    const [confirmOrderModal, setConfirmOrderModal] = useState<{ isOpen: boolean; order: StoreOrder | null; action: 'APPROVE' | 'SHIP' | 'REJECT' }>({ isOpen: false, order: null, action: 'APPROVE' });

    // --- HANDLERS: PRODUCTS ---

    const handleProductSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const productData: StoreProduct = {
            id: editingProduct ? editingProduct.id : `prod_${Date.now()}`,
            ...productForm,
            isFree: productForm.price === 0
        };

        if (editingProduct) {
            setProducts(prev => prev.map(p => p.id === editingProduct.id ? productData : p));
        } else {
            setProducts(prev => [productData, ...prev]);
        }
        setIsProductModalOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setProductForm({ title: '', description: '', type: 'DIGITAL', price: 0, prevPrice: 0, image: '', fileUrl: '', previewUrl: '', stock: 0, category: '' });
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
            category: product.category || ''
        });
        setIsProductModalOpen(true);
    };

    const handleDeleteProduct = (id: string) => {
        if(confirm("Are you sure?")) {
            setProducts(prev => prev.filter(p => p.id !== id));
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) setProductForm(prev => ({...prev, image: event.target?.result as string}));
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    // --- HANDLERS: ORDERS ---

    const handleOrderAction = async () => {
        if (!confirmOrderModal.order) return;
        const { order, action } = confirmOrderModal;
        
        let newStatus: StoreOrder['status'] = 'PENDING';
        if (action === 'APPROVE') newStatus = 'COMPLETED'; // For Digital, completed means paid & accessible
        if (action === 'SHIP') newStatus = 'SHIPPED'; // For Physical
        if (action === 'REJECT') newStatus = 'REJECTED';

        // Update local state
        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o));
        
        // Update Firestore
        try {
            await setDoc(doc(db, "store_orders", order.id), { status: newStatus }, { merge: true });
        } catch(e) {
            console.error(e);
        }

        setConfirmOrderModal({ isOpen: false, order: null, action: 'APPROVE' });
    };

    // --- FILTERING ---
    const filteredProducts = products.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredOrders = orders.filter(o => o.userName.toLowerCase().includes(searchTerm.toLowerCase()) || o.trxId.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                    <Package className="mr-3 text-indigo-600" size={28} />
                    Store Management
                </h1>
                
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('PRODUCTS')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'PRODUCTS' ? 'bg-white shadow text-indigo-700' : 'text-slate-500'}`}
                    >
                        Products
                    </button>
                    <button 
                        onClick={() => setActiveTab('ORDERS')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center ${activeTab === 'ORDERS' ? 'bg-white shadow text-emerald-700' : 'text-slate-500'}`}
                    >
                        Orders
                        {orders.filter(o => o.status === 'PENDING').length > 0 && (
                            <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                {orders.filter(o => o.status === 'PENDING').length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* SEARCH */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder={activeTab === 'PRODUCTS' ? "Search products..." : "Search orders (Name/TrxID)..."}
                    className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* --- PRODUCTS TAB --- */}
            {activeTab === 'PRODUCTS' && (
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <Button onClick={() => { resetForm(); setIsProductModalOpen(true); }} className="flex items-center">
                            <Plus size={18} className="mr-2" /> Add Product
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProducts.map(product => (
                            <Card key={product.id} className="overflow-hidden flex flex-col relative group">
                                <div className="h-40 w-full bg-slate-100 relative">
                                    <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                                    <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-bold shadow-sm">
                                        {product.type === 'DIGITAL' ? 'PDF / E-Book' : 'Printed Book'}
                                    </div>
                                    {product.isFree && (
                                        <div className="absolute top-2 left-2 bg-emerald-500 text-white px-2 py-1 rounded text-xs font-bold shadow-sm">FREE</div>
                                    )}
                                </div>
                                <div className="p-4 flex-1 flex flex-col">
                                    <h3 className="font-bold text-slate-800 text-lg mb-1">{product.title}</h3>
                                    <p className="text-sm text-slate-500 line-clamp-2 mb-3">{product.description}</p>
                                    
                                    <div className="mt-auto flex justify-between items-center pt-3 border-t border-slate-100">
                                        <div>
                                            <span className="text-lg font-bold text-indigo-600">৳{product.price}</span>
                                            {product.prevPrice && product.prevPrice > product.price && (
                                                <span className="text-xs text-slate-400 line-through ml-2">৳{product.prevPrice}</span>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => openEditProduct(product)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full"><Edit size={18} /></button>
                                            <button onClick={() => handleDeleteProduct(product.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full"><Trash2 size={18} /></button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* --- ORDERS TAB --- */}
            {activeTab === 'ORDERS' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Customer</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Product</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Payment</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                                <th className="p-4 text-right text-xs font-bold text-slate-500 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredOrders.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-400">No orders found.</td>
                                </tr>
                            )}
                            {filteredOrders.map(order => (
                                <tr key={order.id} className="hover:bg-slate-50/50">
                                    <td className="p-4">
                                        <p className="font-bold text-slate-800 text-sm">{order.userName}</p>
                                        <p className="text-xs text-slate-500">{order.userPhone}</p>
                                        {order.address && (
                                            <p className="text-[10px] text-slate-400 mt-1 max-w-[150px] truncate" title={order.address}>{order.address}</p>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <p className="text-sm font-medium text-slate-700">{order.productTitle}</p>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${order.productType === 'DIGITAL' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {order.productType}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <p className="font-bold text-slate-700 text-sm">৳{order.amount}</p>
                                        <p className="text-xs text-slate-500">{order.method} • <span className="font-mono">{order.trxId}</span></p>
                                    </td>
                                    <td className="p-4">
                                        <Badge color={
                                            order.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                            order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-700' :
                                            order.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                            'bg-amber-100 text-amber-700'
                                        }>
                                            {order.status}
                                        </Badge>
                                    </td>
                                    <td className="p-4 text-right">
                                        {order.status === 'PENDING' && (
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" onClick={() => setConfirmOrderModal({ isOpen: true, order, action: 'APPROVE' })} className="bg-emerald-600 hover:bg-emerald-700 h-8 px-3">
                                                    Approve
                                                </Button>
                                                <Button size="sm" variant="danger" onClick={() => setConfirmOrderModal({ isOpen: true, order, action: 'REJECT' })} className="h-8 px-3">
                                                    <XCircle size={16} />
                                                </Button>
                                            </div>
                                        )}
                                        {order.status === 'COMPLETED' && order.productType === 'PHYSICAL' && (
                                            <Button size="sm" onClick={() => setConfirmOrderModal({ isOpen: true, order, action: 'SHIP' })} className="bg-blue-600 hover:bg-blue-700 h-8 px-3">
                                                Mark Shipped
                                            </Button>
                                        )}
                                        {order.status === 'COMPLETED' && order.productType === 'DIGITAL' && (
                                            <span className="text-xs text-emerald-600 font-bold flex items-center justify-end"><CheckCircle size={14} className="mr-1"/> Delivered</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* PRODUCT MODAL */}
            <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title={editingProduct ? "Edit Product" : "Add New Product"}>
                <form onSubmit={handleProductSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-1">Product Title</label>
                            <input required className="w-full p-2 border rounded" value={productForm.title} onChange={e => setProductForm({...productForm, title: e.target.value})} />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                            <textarea required className="w-full p-2 border rounded h-20" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Type</label>
                            <div className="flex border rounded overflow-hidden">
                                <button type="button" onClick={() => setProductForm({...productForm, type: 'DIGITAL'})} className={`flex-1 py-2 text-sm font-bold ${productForm.type === 'DIGITAL' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600'}`}>Digital (PDF)</button>
                                <button type="button" onClick={() => setProductForm({...productForm, type: 'PHYSICAL'})} className={`flex-1 py-2 text-sm font-bold ${productForm.type === 'PHYSICAL' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600'}`}>Physical</button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Price (৳)</label>
                            <input type="number" required className="w-full p-2 border rounded" value={productForm.price} onChange={e => setProductForm({...productForm, price: Number(e.target.value)})} />
                            <p className="text-[10px] text-slate-400">Set 0 for Free</p>
                        </div>

                        {productForm.type === 'DIGITAL' ? (
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-1">PDF File URL</label>
                                <input required className="w-full p-2 border rounded" placeholder="https://..." value={productForm.fileUrl} onChange={e => setProductForm({...productForm, fileUrl: e.target.value})} />
                            </div>
                        ) : (
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-1">Stock Quantity</label>
                                <input type="number" className="w-full p-2 border rounded" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: Number(e.target.value)})} />
                            </div>
                        )}

                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-1">Preview/Sample URL (Optional)</label>
                            <input className="w-full p-2 border rounded" placeholder="https://..." value={productForm.previewUrl} onChange={e => setProductForm({...productForm, previewUrl: e.target.value})} />
                            <p className="text-[10px] text-slate-400">Link to sample PDF or images for "Look Inside" feature.</p>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-1">Cover Image</label>
                            <div className="flex items-center gap-3">
                                <div className="relative overflow-hidden w-24 h-24 bg-slate-100 rounded border border-slate-200">
                                    {productForm.image ? (
                                        <img src={productForm.image} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-slate-300"><ImageIcon size={24} /></div>
                                    )}
                                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} />
                                </div>
                                <div className="text-xs text-slate-500">Click box to upload cover image.</div>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button type="submit">{editingProduct ? "Update Product" : "Add Product"}</Button>
                    </div>
                </form>
            </Modal>

            {/* ORDER CONFIRM MODAL */}
            <Modal isOpen={confirmOrderModal.isOpen} onClose={() => setConfirmOrderModal({ ...confirmOrderModal, isOpen: false })} title="Confirm Action">
                <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-lg text-sm border border-slate-200">
                        <p><strong>Order ID:</strong> {confirmOrderModal.order?.id}</p>
                        <p><strong>Customer:</strong> {confirmOrderModal.order?.userName}</p>
                        <p><strong>Item:</strong> {confirmOrderModal.order?.productTitle}</p>
                        {confirmOrderModal.action === 'APPROVE' && (
                            <p className="mt-2 text-indigo-600 font-bold">Action: Verify Payment (TrxID: {confirmOrderModal.order?.trxId}) and Approve?</p>
                        )}
                        {confirmOrderModal.action === 'SHIP' && (
                            <p className="mt-2 text-blue-600 font-bold">Action: Mark as Shipped/Delivered?</p>
                        )}
                        {confirmOrderModal.action === 'REJECT' && (
                            <p className="mt-2 text-red-600 font-bold">Action: Reject Order?</p>
                        )}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setConfirmOrderModal({ ...confirmOrderModal, isOpen: false })}>Cancel</Button>
                        <Button 
                            onClick={handleOrderAction} 
                            variant={confirmOrderModal.action === 'REJECT' ? 'danger' : 'primary'}
                        >
                            Confirm {confirmOrderModal.action}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default StoreManagement;