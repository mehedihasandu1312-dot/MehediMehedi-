
import React, { useState } from 'react';
import { Card, Button, Badge, Modal } from '../../components/UI';
import { StoreProduct, StoreOrder, ProductType } from '../../types';
import { Plus, Edit, Trash2, Search, ShoppingBag } from 'lucide-react';
import { db } from '../../services/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface Props {
    products: StoreProduct[];
    setProducts: React.Dispatch<React.SetStateAction<StoreProduct[]>>;
    orders: StoreOrder[];
    setOrders: React.Dispatch<React.SetStateAction<StoreOrder[]>>;
    educationLevels?: { REGULAR: string[], ADMISSION: string[] }; 
}

const StoreManagement: React.FC<Props> = ({ products, setProducts, orders, setOrders }) => {
    const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'ORDERS'>('PRODUCTS');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Simple form state
    const [formData, setFormData] = useState<Partial<StoreProduct>>({
        title: '', price: 0, type: 'DIGITAL', isFree: false, image: '', description: ''
    });

    const handleSaveProduct = (e: React.FormEvent) => {
        e.preventDefault();
        const newProduct: StoreProduct = {
            id: `prod_${Date.now()}`,
            title: formData.title || 'Untitled',
            description: formData.description || '',
            type: formData.type || 'DIGITAL',
            price: Number(formData.price),
            image: formData.image || 'https://via.placeholder.com/150',
            isFree: Number(formData.price) === 0,
            fileUrl: '',
            ...formData
        } as StoreProduct;

        setProducts([newProduct, ...products]);
        setIsModalOpen(false);
        setFormData({ title: '', price: 0, type: 'DIGITAL', isFree: false, image: '', description: '' });
    };

    const handleDelete = (id: string) => {
        if (confirm("Delete product?")) {
            setProducts(products.filter(p => p.id !== id));
        }
    };

    const handleOrderAction = async (orderId: string, status: 'COMPLETED' | 'REJECTED') => {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
        try {
            await setDoc(doc(db, "store_orders", orderId), { status }, { merge: true });
        } catch(e) { console.error(e); }
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Store Management</h1>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => setActiveTab('PRODUCTS')} className={`px-4 py-2 text-sm font-bold rounded ${activeTab === 'PRODUCTS' ? 'bg-white shadow' : ''}`}>Products</button>
                    <button onClick={() => setActiveTab('ORDERS')} className={`px-4 py-2 text-sm font-bold rounded ${activeTab === 'ORDERS' ? 'bg-white shadow' : ''}`}>Orders</button>
                </div>
            </div>

            {activeTab === 'PRODUCTS' && (
                <>
                    <Button onClick={() => setIsModalOpen(true)} className="flex items-center"><Plus size={16} className="mr-2"/> Add Product</Button>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        {products.map(p => (
                            <Card key={p.id} className="relative">
                                <img src={p.image} className="w-full h-32 object-cover rounded mb-2 bg-slate-100" />
                                <h3 className="font-bold">{p.title}</h3>
                                <p className="text-sm text-slate-500">{p.type} - ৳{p.price}</p>
                                <button onClick={() => handleDelete(p.id)} className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded"><Trash2 size={16}/></button>
                            </Card>
                        ))}
                    </div>
                </>
            )}

            {activeTab === 'ORDERS' && (
                <div className="space-y-3">
                    {orders.map(order => (
                        <Card key={order.id} className="flex justify-between items-center">
                            <div>
                                <h4 className="font-bold">{order.productTitle}</h4>
                                <p className="text-sm text-slate-500">By {order.userName} • ৳{order.amount}</p>
                                <Badge>{order.status}</Badge>
                            </div>
                            {order.status === 'PENDING' && (
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={() => handleOrderAction(order.id, 'COMPLETED')}>Approve</Button>
                                    <Button size="sm" variant="danger" onClick={() => handleOrderAction(order.id, 'REJECTED')}>Reject</Button>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Product">
                <form onSubmit={handleSaveProduct} className="space-y-4">
                    <input className="w-full p-2 border rounded" placeholder="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                    <input className="w-full p-2 border rounded" type="number" placeholder="Price" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} required />
                    <select className="w-full p-2 border rounded" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                        <option value="DIGITAL">Digital</option>
                        <option value="PHYSICAL">Physical</option>
                    </select>
                    <textarea className="w-full p-2 border rounded" placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    <input className="w-full p-2 border rounded" placeholder="Image URL" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} />
                    <Button type="submit" className="w-full">Save</Button>
                </form>
            </Modal>
        </div>
    );
};

export default StoreManagement;
