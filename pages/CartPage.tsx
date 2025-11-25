
import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import StarRating from '../components/common/StarRating';
import { Trash2, ShoppingCart, CheckCircle, Clock, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')} VNĐ`;

const CartPage: React.FC = () => {
    const { cartItems, removeFromCart, cartTotal, clearCart } = useCart();
    const [isPaid, setIsPaid] = useState(false);

    const handleCheckout = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate payment processing
        console.log('Processing payment...');
        setTimeout(() => {
            setIsPaid(true);
            clearCart();
        }, 1500);
    };

    if (isPaid) {
        return (
            <div className="text-center py-20">
                <CheckCircle className="mx-auto text-green-400" size={64} />
                <h1 className="mt-4 text-4xl font-bold">Payment Successful!</h1>
                <p className="text-gray-400 mt-2">Thank you for your purchase. Your items will be available in your profile shortly.</p>
                <div className="mt-8 flex justify-center gap-4">
                    <Link to="/profile"><Button variant="secondary">Go to My Profile</Button></Link>
                    <Link to="/marketplace"><Button>Continue Shopping</Button></Link>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <h1 className="text-4xl font-bold text-center">Your Shopping Cart</h1>

            {cartItems.length === 0 ? (
                <div className="text-center py-10">
                    <ShoppingCart className="mx-auto text-gray-500" size={48} />
                    <p className="mt-4 text-xl text-gray-400">Your cart is empty.</p>
                    <Link to="/marketplace" className="mt-4 inline-block"><Button>Start Shopping</Button></Link>
                </div>
            ) : (
                <div className="grid lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2 space-y-4">
                        {cartItems.map(item => (
                            <Card key={item.id} className="p-4">
                                <div className="flex items-center gap-4">
                                    <Link to={`/courses/${item.id}`}>
                                        <img src={item.imageUrl} alt={item.title} className="w-24 h-24 object-cover rounded-md hover:opacity-80 transition-opacity" />
                                    </Link>
                                    <div className="flex-grow">
                                        <Link to={`/courses/${item.id}`}>
                                            <h3 className="font-bold text-lg hover:text-sky-400 transition-colors">{item.title}</h3>
                                        </Link>
                                        <p className="text-sm text-gray-400 mb-2">by {item.author}</p>

                                        {/* Course info */}
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            {item.type && (
                                                <span className="bg-gray-700 px-2 py-1 rounded">{item.type}</span>
                                            )}
                                            {item.duration && (
                                                <div className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {item.duration}
                                                </div>
                                            )}
                                            {item.level && (
                                                <div className="flex items-center gap-1">
                                                    <Award size={12} />
                                                    {item.level === 'BEGINNER' ? 'Co b?n' :
                                                        item.level === 'INTERMEDIATE' ? 'Trung c?p' :
                                                            item.level === 'ADVANCED' ? 'N�ng cao' : 'Chuy�n gia'}
                                                </div>
                                            )}
                                        </div>

                                        {/* Rating */}
                                        {item.rating && (
                                            <div className="mt-2">
                                                <StarRating rating={item.rating} reviewCount={item.reviewCount} size="sm" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg text-sky-400">{formatCurrency(item.price)}</p>
                                        <p className="text-xs text-gray-400 mb-2">S? lu?ng: {item.quantity}</p>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-gray-500 hover:text-red-500 mt-2 p-1 rounded hover:bg-gray-700 transition-colors"
                                            title="X�a kh?i gi? h�ng"
                                            aria-label="X�a kh?i gi? h�ng"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    <div className="sticky top-24">
                        <Card className="p-6">
                            <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-gray-300">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(cartTotal)}</span>
                                </div>
                                <div className="flex justify-between text-gray-300">
                                    <span>Taxes (5%)</span>
                                    <span>{formatCurrency(cartTotal * 0.05)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-white text-lg pt-2 border-t border-gray-700">
                                    <span>Total</span>
                                    <span>{formatCurrency(cartTotal * 1.05)}</span>
                                </div>
                            </div>
                            <form onSubmit={handleCheckout}>
                                {/* This is a mock form. Real integration would use Stripe/PayPal components. */}
                                <div className="space-y-3 mt-6">
                                    <input type="text" placeholder="Card Number" className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                    <div className="flex gap-3">
                                        <input type="text" placeholder="MM/YY" className="w-1/2 bg-gray-800 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                        <input type="text" placeholder="CVC" className="w-1/2 bg-gray-800 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full mt-6">Proceed to Checkout</Button>
                            </form>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartPage;
