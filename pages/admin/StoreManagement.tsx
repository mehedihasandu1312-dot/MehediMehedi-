
import React, { useState, useRef } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { StoreProduct, StoreOrder, ProductType } from '../../types';
import { Package, Plus, Edit, Trash2, CheckCircle, XCircle, Search, Upload, X, Image as ImageIcon, Eye, Loader2, Link as LinkIcon, Target, Zap, Filter } from 'lucide-react';
import { db, storage } from '../../services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

interface Props {
    products: StoreProduct[];
    setProducts: React.Dispatch<React.SetStateAction<StoreProduct[]>>;
    orders: StoreOrder[];
    setOrders: React.Dispatch<React.SetStateAction<StoreOrder[]>>;
    educationLevels?: { REGULAR: string[], ADMISSION: string[] }; 
}

// Reduced limit to 400KB (approx 530KB Base64) to be safe within Firestore 1MB limit
const DIRECT_UPLOAD_LIMIT = 400 * 1024; 

const StoreManagement: React.FC<Props> = ({ products, setProducts, orders, setOrders, educationLevels }) => {
    const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'ORDERS'>('PRODUCTS');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterClass, setFilterClass] = useState('ALL');

    // --- PRODUCT MANAGEMENT STATE ---
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
    const [productForm, setProductForm] = useState<{
        title: string; description: string; type: ProductType; price: number; 
        prevPrice: number; image: string; fileUrl: string; previewUrl: string; stock: number; category: string; targetClass: string;
    }>({
        title: '', description: '', type: 'DIGITAL', price: 0, prevPrice: 0, 
        image: '', fileUrl: '', previewUrl: '', stock: 0, category: '', targetClass: ''
    });

    // Uploading State
    const [uploadingField, setUploadingField] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number>(0);

    // Refs for File Inputs
    const imageInputRef = useRef<HTMLInputElement>(null);
    const pdfInputRef = useRef<HTMLInputElement>(null);
    const sampleInputRef = useRef<HTMLInputElement>(null);

    // --- ORDER CONFIRMATION STATE ---
    const [confirmOrderModal, setConfirmOrderModal] = useState<{ isOpen: boolean; order: StoreOrder | null; action: 'APPROVE' | 'SHIP' | 'REJECT' }>({ isOpen: false, order: null, action: 'APPROVE' });

    // --- HANDLERS: PRODUCTS ---

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
        } else {
            setProducts(prev => [productData, ...prev]);
        }
        setIsProductModalOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setProductForm({ title: '', description: '', type: 'DIGITAL', price: 0, prevPrice: 0, image: '', fileUrl: '', previewUrl: '', stock: 0, category: '', targetClass: '' });
        setEditingProduct(null);
        setUploadingField(null);
        setUploadProgress(0);
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

    const handleDeleteProduct = (id: string) => {
        if(confirm("Are you sure?")) {
            setProducts(prev => prev.filter(p => p.id !== id));
        }
    };

    // HYBRID UPLOAD SYSTEM: Direct Base64 (<400KB) OR Firebase Storage (>400KB)
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'image' | 'fileUrl' | 'previewUrl') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingField(field);
        setUploadProgress(0);

        if (file.size < DIRECT_UPLOAD_LIMIT) {
            // Option 1: Small File -> Convert to Base64 (Direct DB Storage)
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setProductForm(prev => ({...prev, [field]: event.target!.result as string}));
                    setUploadingField(null);
                    setUploadProgress(0);
                }
            };
            reader.onerror = () => {
                alert("Failed to read file.");
                setUploadingField(null);
            };
            reader.readAsDataURL(file);
        } else {
            // Option 2: Large File -> Firebase Storage
            const storageRef = ref(storage, `store_uploads/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed', 
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                }, 
                (error) => {
                    console.error("Upload error:", error);
                    alert(`Upload failed: ${error.message}. Please use a direct link instead.`);
                    setUploadingField(null);
                    setUploadProgress(0);
                }, 
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    setProductForm(prev => ({...prev, [field]: downloadURL}));
                    setUploadingField(null);
                    setUploadProgress(0);
                }
            );
        }
    };

    // --- HANDLERS: ORDERS ---

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
        } catch(e) {
            console.error(e);
        }

        setConfirmOrderModal({ isOpen: false, order: null, action: 'APPROVE' });
    };

    // Helper to handle broken images
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        e.currentTarget.src = 'https://placehold.co/400x600?text=No+Cover';
    };

    // --- FILTERING ---
    const filteredProducts = products.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesClass = filterClass === 'ALL' || (p.targetClass === filterClass);
        return matchesSearch && matchesClass;
    });

    const filteredOrders = orders.filter(o => o.userName.toLowerCase().includes(searchTerm.toLowerCase()) || o.trxId.toLowerCase().includes(searchTerm.toLowerCase()));

    const levels = educationLevels || { REGULAR: [], ADMISSION: [] };

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

            {/* SEARCH & FILTER */}
            <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder={activeTab === 'PRODUCTS' ? "Search products..." : "Search orders (Name/TrxID)..."}
                        className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {activeTab === 'PRODUCTS' && (
                    <div className="relative min-w-[200px]">
                        <Filter className="absolute left-3 top-3 text-slate-400" size={16} />
                        <select 
                            className="w-full pl-9 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm font-medium"
                            value={filterClass}
                            onChange={e => setFilterClass(e.target.value)}
                        >
                            <option value="ALL">All Classes / General</option>
                            <optgroup label="Regular">
                                {levels.REGULAR.map(c => <option key={c} value={c}>{c}</option>)}
                            </optgroup>
                            <optgroup label="Admission">
                                {levels.ADMISSION.map(c => <option key={c} value={c}>{c}</option>)}
                            </optgroup>
                        </select>
                    </div>
                )}
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
                                    <img 
                                        src={product.image} 
                                        alt={product.title} 
                                        className="w-full h-full object-cover" 
                                        onError={handleImageError}
                                    />
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
                                    
                                    {/* Class Badge */}
                                    <div className="mb-2">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded ${product.targetClass ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {product.targetClass ? product.targetClass : 'General / All Classes'}
                                        </span>
                                    </div>

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

            {/* PRODUCT MODAL - UPDATED SIZE & LAYOUT */}
            <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title={editingProduct ? "Edit Product" : "Add New Product"} size="lg">
                <form onSubmit={handleProductSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* LEFT COL */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Product Title</label>
                                <input required className="w-full p-2 border rounded" value={productForm.title} onChange={e => setProductForm({...productForm, title: e.target.value})} />
                            </div>
                            
                            {/* Target Class Selection */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Target Class</label>
                                <div className="relative">
                                    <Target size={16} className="absolute left-3 top-3 text-slate-400" />
                                    <select 
                                        className="w-full pl-9 p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                        value={productForm.targetClass}
                                        onChange={e => setProductForm({...productForm, targetClass: e.target.value})}
                                    >
                                        <option value="">-- All Classes / General --</option>
                                        <optgroup label="Regular & Job Prep">
                                            {levels.REGULAR.map(c => <option key={c} value={c}>{c}</option>)}
                                        </optgroup>
                                        <optgroup label="Admission">
                                            {levels.ADMISSION.map(c => <option key={c} value={c}>{c}</option>)}
                                        </optgroup>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Type</label>
                                <div className="flex border rounded overflow-hidden">
                                    <button type="button" onClick={() => setProductForm({...productForm, type: 'DIGITAL'})} className={`flex-1 py-2 text-sm font-bold ${productForm.type === 'DIGITAL' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600'}`}>Digital (PDF)</button>
                                    <button type="button" onClick={() => setProductForm({...productForm, type: 'PHYSICAL'})} className={`flex-1 py-2 text-sm font-bold ${productForm.type === 'PHYSICAL' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600'}`}>Physical</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Price (৳)</label>
                                    <input type="number" required className="w-full p-2 border rounded" value={productForm.price} onChange={e => setProductForm({...productForm, price: Number(e.target.value)})} />
                                </div>
                                {productForm.type === 'PHYSICAL' && (
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Stock</label>
                                        <input type="number" className="w-full p-2 border rounded" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: Number(e.target.value)})} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COL */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                                <textarea required className="w-full p-2 border rounded h-24" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Cover Image</label>
                                <input 
                                    type="file" 
                                    ref={imageInputRef} 
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleFileUpload(e, 'image')}
                                />
                                <div className="flex items-center gap-4">
                                    <div 
                                        className="relative overflow-hidden w-20 h-24 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                                        onClick={() => imageInputRef.current?.click()}
                                    >
                                        {uploadingField === 'image' ? (
                                            <div className="flex flex-col items-center">
                                                <Loader2 size={20} className="animate-spin text-indigo-500 mb-1" />
                                            </div>
                                        ) : productForm.image ? (
                                            <img src={productForm.image} className="w-full h-full object-cover" alt="Cover" onError={handleImageError} />
                                        ) : (
                                            <div className="text-center text-slate-400">
                                                <ImageIcon size={20} className="mx-auto" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-xs text-slate-500 flex-1">
                                        <div className="flex gap-2">
                                            <Button type="button" size="sm" variant="outline" onClick={() => imageInputRef.current?.click()} disabled={!!uploadingField} className="h-7 text-xs px-2">
                                                {productForm.image ? "Change" : "Upload"}
                                            </Button>
                                        </div>
                                        <div className="mt-2">
                                            <input 
                                                type="text" 
                                                className="w-full p-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                                                placeholder="Or Paste URL..."
                                                value={productForm.image}
                                                onChange={(e) => setProductForm({...productForm, image: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* File Inputs (Full Width) */}
                    {productForm.type === 'DIGITAL' && (
                        <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200 mt-4">
                            <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                <Zap size={14} className="mr-1 text-amber-500"/> Digital Assets
                            </h4>
                            
                            {/* MAIN FILE */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Main PDF (Product)</label>
                                    <input type="file" ref={pdfInputRef} accept="application/pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'fileUrl')} />
                                    <div className="flex gap-2">
                                        <Button type="button" variant="outline" size="sm" onClick={() => pdfInputRef.current?.click()} disabled={!!uploadingField} className="w-full flex justify-center text-xs">
                                            {uploadingField === 'fileUrl' ? <Loader2 size={14} className="animate-spin"/> : <Upload size={14} className="mr-1" />}
                                            {productForm.fileUrl ? "Re-upload" : "Upload PDF"}
                                        </Button>
                                    </div>
                                    <input type="text" className="w-full mt-2 p-1.5 text-xs border rounded" placeholder="Or Paste Drive Link..." value={productForm.fileUrl} onChange={(e) => setProductForm({...productForm, fileUrl: e.target.value})} />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Sample PDF (Optional)</label>
                                    <input type="file" ref={sampleInputRef} accept="application/pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'previewUrl')} />
                                    <div className="flex gap-2">
                                        <Button type="button" variant="outline" size="sm" onClick={() => sampleInputRef.current?.click()} disabled={!!uploadingField} className="w-full flex justify-center text-xs text-slate-500">
                                            {uploadingField === 'previewUrl' ? <Loader2 size={14} className="animate-spin"/> : <Eye size={14} className="mr-1" />}
                                            {productForm.previewUrl ? "Re-upload" : "Upload Sample"}
                                        </Button>
                                    </div>
                                    <input type="text" className="w-full mt-2 p-1.5 text-xs border rounded" placeholder="Or Paste Link..." value={productForm.previewUrl} onChange={(e) => setProductForm({...productForm, previewUrl: e.target.value})} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <Button type="submit" disabled={!!uploadingField} className="w-full md:w-auto">
                            {uploadingField ? "Uploading..." : (editingProduct ? "Update Product" : "Add Product")}
                        </Button>
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
