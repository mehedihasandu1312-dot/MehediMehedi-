
import React, { useState, useMemo } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { StoreProduct, StoreOrder, User } from '../../types';
import { ShoppingBag, Search, Filter, Lock, Unlock, Truck, FileText, CheckCircle, CreditCard, Copy, AlertTriangle, Download, Package, Clock, X, Eye, ExternalLink } from 'lucide-react';
import { authService } from '../../services/authService';
import { db } from '../../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import SEO from '../../components/SEO';

interface Props {
    user: User;
    products: StoreProduct[];
    orders: StoreOrder[];
    setOrders: React.Dispatch<React.SetStateAction<StoreOrder[]>>;
}

const Store: React.FC<Props> = ({ user, products, orders, setOrders }) => {
    const [activeTab, setActiveTab] = useState<'BROWSE' | 'MY_ORDERS'>('BROWSE');
    const [filterType, setFilterType] = useState<'ALL' | 'DIGITAL' | 'PHYSICAL'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Purchase State
    const [buyModalOpen, setBuyModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad'>('bKash');
    const [senderNumber, setSenderNumber] = useState('');
    const [trxId, setTrxId] = useState('');
    const [shippingAddress, setShippingAddress] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Preview State
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');

    // Fetch Payment Numbers (Real-time)
    const [paymentNumbers, setPaymentNumbers] = useState({ bKash: '', Nagad: '' });
    React.useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, "settings", "global_settings"), (doc) => {
            if(doc.exists()) {
                setPaymentNumbers(doc.data().paymentNumbers || { bKash: '', Nagad: '' });
            }
        });
        return () => unsubscribe();
    }, []);

    // Filter Logic
    const displayProducts = products.filter(p => {
        // Filter by Class: Show if product has no class (General) OR if it matches user's class
        const matchesClass = !p.targetClass || p.targetClass === user.class;
        
        const matchesType = filterType === 'ALL' || p.type === filterType;
        const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesClass && matchesType && matchesSearch;
    });

    const myOrders = useMemo(() => orders.filter(o => o.userId === user.id).sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()), [orders, user.id]);

    // Handlers
    const openBuyModal = (product: StoreProduct) => {
        setSelectedProduct(product);
        setSenderNumber('');
        setTrxId('');
        // Pre-fill address if user has one in profile
        setShippingAddress(user.district ? `${user.district}` : '');
        setBuyModalOpen(true);
    };

    const handlePurchase = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct) return;

        // Validation for Physical Products
        if (selectedProduct.type === 'PHYSICAL' && !shippingAddress.trim()) {
            alert("Delivery Address is required for printed books.");
            return;
        }

        setIsSubmitting(true);

        const newOrder: StoreOrder = {
            id: `ord_${Date.now()}`,
            userId: user.id,
            userName: user.name,
            userPhone: user.phone || 'N/A',
            productId: selectedProduct.id,
            productTitle: selectedProduct.title,
            productType: selectedProduct.type,
            amount: selectedProduct.price,
            method: paymentMethod,
            senderNumber,
            trxId,
            address: selectedProduct.type === 'PHYSICAL' ? shippingAddress : undefined,
            status: 'PENDING',
            orderDate: new Date().toISOString(),
            fileUrl: selectedProduct.fileUrl
        };

        try {
            await authService.submitStoreOrder(newOrder); 
            setOrders([newOrder, ...orders]);
            alert("Order placed successfully! Please wait for admin approval.");
            setBuyModalOpen(false);
        } catch (error) {
            alert("Failed to place order.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Smooth Download Function
    const handleDownload = (url?: string, filename?: string) => {
        if (!url) return;
        
        // Create a temporary link to trigger download
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename || 'download'); // This attribute triggers download
        link.setAttribute('target', '_self'); // Keeps it in the same tab
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePreview = (url?: string) => {
        if(!url) return;
        setPreviewUrl(url);
        setPreviewModalOpen(true);
    };

    // Helper to handle broken images
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        e.currentTarget.src = 'https://placehold.co/400x600?text=No+Cover';
    };

    // Check if user already owns a digital product
    const hasPurchased = (productId: string) => {
        return myOrders.some(o => o.productId === productId && o.status === 'COMPLETED');
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* ADVANCED SEO FOR STORE: Generates Schema for List of Products */}
            <SEO 
                title="Book Store & Resources" 
                description="Buy educational books, download PDF notes, and access premium study guides for SSC, HSC and Admission." 
                keywords={["books", "PDF notes", "study guide", "SSC suggestion", "HSC books", "University Admission"]}
                type="website"
            />

            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                        <ShoppingBag className="mr-3 text-indigo-600" size={28} />
                        Book Store
                    </h1>
                    <p className="text-slate-500 text-sm">Buy printed books or download digital PDFs.</p>
                </div>
                
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('BROWSE')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'BROWSE' ? 'bg-white shadow text-indigo-700' : 'text-slate-500'}`}
                    >
                        Browse Store
                    </button>
                    <button 
                        onClick={() => setActiveTab('MY_ORDERS')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center ${activeTab === 'MY_ORDERS' ? 'bg-white shadow text-emerald-700' : 'text-slate-500'}`}
                    >
                        My Orders
                    </button>
                </div>
            </div>

            {/* BROWSE TAB */}
            {activeTab === 'BROWSE' && (
                <div className="space-y-6">
                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search books..."
                                className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setFilterType('ALL')} className={`px-4 py-2 rounded-lg text-xs font-bold border ${filterType === 'ALL' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-300'}`}>All</button>
                            <button onClick={() => setFilterType('DIGITAL')} className={`px-4 py-2 rounded-lg text-xs font-bold border flex items-center ${filterType === 'DIGITAL' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300'}`}><FileText size={14} className="mr-1"/> E-Books</button>
                            <button onClick={() => setFilterType('PHYSICAL')} className={`px-4 py-2 rounded-lg text-xs font-bold border flex items-center ${filterType === 'PHYSICAL' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-slate-600 border-slate-300'}`}><Package size={14} className="mr-1"/> Printed</button>
                        </div>
                    </div>

                    {/* Products Grid - UPDATED FOR HIGH DENSITY (Mobile: 2, Desktop: 5/6) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                        {displayProducts.length === 0 && (
                            <div className="col-span-full text-center py-20 text-slate-400">
                                <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
                                <p>No books found for your class or criteria.</p>
                            </div>
                        )}
                        {displayProducts.map(product => {
                            const isOwned = hasPurchased(product.id);
                            return (
                                <Card key={product.id} className="overflow-hidden flex flex-col p-0 border border-slate-200 hover:shadow-lg transition-all group h-full">
                                    <div className="h-32 md:h-40 w-full bg-slate-100 relative overflow-hidden shrink-0">
                                        <img 
                                            src={product.image} 
                                            alt={product.title} 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                                            onError={handleImageError}
                                        />
                                        <div className="absolute top-1 right-1 bg-white/90 px-1.5 py-0.5 rounded text-[10px] font-bold shadow-sm flex items-center">
                                            {product.type === 'DIGITAL' ? <FileText size={10} className="mr-1 text-blue-600"/> : <Package size={10} className="mr-1 text-amber-600"/>}
                                            {product.type === 'DIGITAL' ? 'PDF' : 'Book'}
                                        </div>
                                        {product.isFree && <div className="absolute top-1 left-1 bg-emerald-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold shadow-sm">FREE</div>}
                                        
                                        {/* Preview Button on Cover */}
                                        {product.previewUrl && (
                                            <div className="absolute bottom-0 w-full bg-black/50 text-white py-1 text-[10px] font-bold text-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" onClick={(e) => { e.stopPropagation(); handlePreview(product.previewUrl); }}>
                                                <Eye size={10} className="mr-1" /> Look Inside
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="p-3 flex-1 flex flex-col">
                                        <h3 className="font-bold text-slate-800 text-sm mb-1 line-clamp-2 leading-tight min-h-[2.5em]" title={product.title}>{product.title}</h3>
                                        
                                        <div className="mt-auto pt-2 border-t border-slate-100 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-base font-black text-indigo-600">{product.isFree ? 'Free' : `৳${product.price}`}</span>
                                                    {product.prevPrice && product.prevPrice > product.price && (
                                                        <span className="text-[10px] text-slate-400 line-through ml-1">৳{product.prevPrice}</span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {product.isFree ? (
                                                <Button size="sm" onClick={() => handleDownload(product.fileUrl, product.title)} className="w-full bg-emerald-600 hover:bg-emerald-700 h-8 text-xs px-0">
                                                    Download
                                                </Button>
                                            ) : isOwned ? (
                                                <Button size="sm" disabled className="w-full bg-slate-100 text-slate-500 border-slate-200 h-8 text-xs px-0">
                                                    Owned
                                                </Button>
                                            ) : (
                                                <Button size="sm" onClick={() => openBuyModal(product)} className="w-full h-8 text-xs px-0">
                                                    Buy Now
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* MY ORDERS TAB */}
            {activeTab === 'MY_ORDERS' && (
                <div className="space-y-4">
                    {myOrders.length === 0 ? (
                        <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                            <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
                            <p>You haven't purchased anything yet.</p>
                        </div>
                    ) : (
                        myOrders.map(order => (
                            <Card key={order.id} className="flex flex-col md:flex-row gap-4 items-start md:items-center p-4 border-l-4 border-l-indigo-500">
                                <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                                    {order.productType === 'DIGITAL' ? <FileText size={24} /> : <Package size={24} />}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-800">{order.productTitle}</h4>
                                    <p className="text-xs text-slate-500 flex items-center mt-1">
                                        <Clock size={12} className="mr-1"/> {new Date(order.orderDate).toLocaleDateString()}
                                        <span className="mx-2">•</span>
                                        <span className="font-mono">Order #{order.id.substring(4, 10).toUpperCase()}</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <Badge color={
                                        order.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                        order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-700' :
                                        order.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                        'bg-amber-100 text-amber-700'
                                    }>
                                        {order.status}
                                    </Badge>
                                    
                                    {order.status === 'COMPLETED' && order.productType === 'DIGITAL' && (
                                        <Button size="sm" onClick={() => handleDownload(order.fileUrl, order.productTitle)} className="mt-2 w-full flex items-center justify-center text-xs">
                                            <Download size={14} className="mr-1"/> Download
                                        </Button>
                                    )}
                                    {order.status === 'SHIPPED' && (
                                        <p className="text-[10px] text-blue-600 font-bold mt-2 flex items-center justify-end">
                                            <Truck size={12} className="mr-1"/> On the way
                                        </p>
                                    )}
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {/* BUY MODAL */}
            <Modal isOpen={buyModalOpen} onClose={() => setBuyModalOpen(false)} title="Complete Purchase">
                {selectedProduct && (
                    <>
                        <SEO 
                            title={`${selectedProduct.title} - EduMaster Store`}
                            description={selectedProduct.description}
                            image={selectedProduct.image}
                            type="product"
                            price={{ amount: selectedProduct.price, currency: 'BDT' }}
                        />
                        <form onSubmit={handlePurchase} className="space-y-6">
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <h4 className="font-bold text-slate-800">{selectedProduct.title}</h4>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded">{selectedProduct.type}</span>
                                    <span className="text-xl font-black text-slate-800">৳{selectedProduct.price}</span>
                                </div>
                            </div>

                            {/* Payment Instructions */}
                            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                                <p className="text-xs text-amber-900 mb-2"><strong>Step 1:</strong> Send ৳{selectedProduct.price} to our Merchant Number.</p>
                                <div className="flex gap-2 mb-3">
                                    <button type="button" onClick={() => setPaymentMethod('bKash')} className={`flex-1 p-2 rounded border text-sm font-bold ${paymentMethod === 'bKash' ? 'bg-pink-100 border-pink-500 text-pink-700' : 'bg-white border-slate-300'}`}>bKash</button>
                                    <button type="button" onClick={() => setPaymentMethod('Nagad')} className={`flex-1 p-2 rounded border text-sm font-bold ${paymentMethod === 'Nagad' ? 'bg-orange-100 border-orange-500 text-orange-700' : 'bg-white border-slate-300'}`}>Nagad</button>
                                </div>
                                <div className="flex items-center justify-between bg-white border border-amber-200 p-2 rounded">
                                    <span className="font-mono font-bold text-slate-700">{paymentNumbers[paymentMethod]}</span>
                                    <button type="button" onClick={() => navigator.clipboard.writeText(paymentNumbers[paymentMethod])} className="text-amber-600"><Copy size={16}/></button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sender Number</label>
                                    <input required type="tel" className="w-full p-2.5 border rounded-lg" placeholder="017..." value={senderNumber} onChange={e => setSenderNumber(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Transaction ID (TrxID)</label>
                                    <input required type="text" className="w-full p-2.5 border rounded-lg uppercase" placeholder="TRX123..." value={trxId} onChange={e => setTrxId(e.target.value)} />
                                </div>
                                
                                {/* Shipping Address for Physical Products (MANDATORY) */}
                                {selectedProduct.type === 'PHYSICAL' && (
                                    <div>
                                        <label className="block text-xs font-bold text-red-600 uppercase mb-1">Delivery Address *</label>
                                        <textarea required className="w-full p-2.5 border border-red-200 bg-red-50 rounded-lg h-20 resize-none focus:ring-red-500 focus:border-red-500" placeholder="Full address including House No, Road No, District..." value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} />
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="outline" type="button" onClick={() => setBuyModalOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Processing...' : 'Confirm Order'}</Button>
                            </div>
                        </form>
                    </>
                )}
            </Modal>

            {/* PREVIEW MODAL */}
            <Modal isOpen={previewModalOpen} onClose={() => setPreviewModalOpen(false)} title="Preview Book">
                <div className="h-[80vh] w-full flex flex-col">
                    <div className="flex-1 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden relative">
                        {/* Logic to handle Data URLs vs Public URLs */}
                        {previewUrl.startsWith('data:') || previewUrl.startsWith('blob:') ? (
                             <object data={previewUrl} type="application/pdf" className="w-full h-full rounded-lg">
                                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                                    <p className="text-slate-500 mb-4">
                                        Your browser's PDF viewer cannot display this file directly inside the app.
                                    </p>
                                    <a 
                                        href={previewUrl} 
                                        download="preview.pdf" 
                                        className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center"
                                    >
                                        <Download size={18} className="mr-2" /> Download to View
                                    </a>
                                </div>
                             </object>
                        ) : (
                            <iframe 
                                src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(previewUrl)}`} 
                                className="w-full h-full" 
                                title="PDF Preview"
                                frameBorder="0"
                            ></iframe>
                        )}
                    </div>
                    
                    <div className="mt-4 flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-500">
                            Having trouble viewing?
                        </p>
                        <div className="flex gap-2">
                            <a 
                                href={previewUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="flex items-center text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors border border-indigo-200"
                            >
                                <ExternalLink size={14} className="mr-1" /> Open Original
                            </a>
                            <Button size="sm" onClick={() => { setPreviewModalOpen(false); if(selectedProduct) openBuyModal(selectedProduct); }}>
                                Buy Full Version
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Store;
