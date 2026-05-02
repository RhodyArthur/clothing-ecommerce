import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';

import { Checkout } from './checkout';
import { Cart } from '../../core/services/cart';
import { Order } from '../../core/services/order';
import { Auth } from '../../core/services/auth';

describe('Checkout', () => {
  let component: Checkout;
  let fixture: ComponentFixture<Checkout>;
  let cartItems: {
    product_id: string;
    name: string;
    price: number;
    quantity: number;
    size: string;
    color: string;
    image_url: string;
  }[];
  let cartMock: {
    items: ReturnType<typeof vi.fn>;
    total: ReturnType<typeof vi.fn>;
    isEmpty: ReturnType<typeof vi.fn>;
    clearCart: ReturnType<typeof vi.fn>;
    updateQuantity: ReturnType<typeof vi.fn>;
  };
  let orderMock: {
    createOrder: ReturnType<typeof vi.fn>;
    markWhatsappSent: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    cartItems = [
      {
        product_id: 'shirt-1',
        name: 'Oxford Shirt',
        price: 35,
        quantity: 2,
        size: 'M',
        color: 'Blue',
        image_url: 'shirt.jpg',
      },
    ];

    cartMock = {
      items: vi.fn(() => cartItems),
      total: vi.fn(() => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)),
      isEmpty: vi.fn(() => cartItems.length === 0),
      clearCart: vi.fn(async () => {
        cartItems = [];
      }),
      updateQuantity: vi.fn(async (productId: string, size: string, color: string, quantity: number) => {
        cartItems = cartItems.map((item) =>
          item.product_id === productId && item.size === size && item.color === color
            ? { ...item, quantity }
            : item,
        );
      }),
    };

    orderMock = {
      createOrder: vi.fn(async () => ({
        id: 'order-12345678',
        user_id: 'user-1',
        items: cartItems,
        total: 70,
        status: 'pending',
        delivery_address: 'Ring Road, Accra, 00233',
        whatsapp_sent: false,
        confirmed_by_customer: false,
        created_at: '2026-01-01T00:00:00Z',
      })),
      markWhatsappSent: vi.fn(async () => undefined),
    };

    await TestBed.configureTestingModule({
      imports: [Checkout],
      providers: [
        { provide: Cart, useValue: cartMock },
        { provide: Order, useValue: orderMock },
        {
          provide: Auth,
          useValue: {
            currentUser: signal({
              id: 'user-1',
              email: 'customer@example.com',
              user_metadata: {
                full_name: 'Customer One',
                phone_number: '0240000000',
              },
            }),
          },
        },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Checkout);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('clears the cart immediately after creating an order', async () => {
    component.form.setValue({
      fullName: 'Customer One',
      email: 'customer@example.com',
      phoneNumber: '0240000000',
      street: 'Ring Road',
      city: 'Accra',
      postalCode: '00233',
      orderNotes: '',
    });

    await component.placeOrder();

    expect(orderMock.createOrder).toHaveBeenCalledWith({
      items: [
        {
          product_id: 'shirt-1',
          name: 'Oxford Shirt',
          price: 35,
          quantity: 2,
          size: 'M',
          color: 'Blue',
          image_url: 'shirt.jpg',
        },
      ],
      total: 70,
      delivery_address: 'Ring Road, Accra, 00233',
    });
    expect(cartMock.clearCart).toHaveBeenCalledTimes(1);
    expect(orderMock.markWhatsappSent).not.toHaveBeenCalled();
  });

  it('updates checkout item quantity without allowing zero quantity', async () => {
    await component.updateCheckoutQuantity('shirt-1', 'M', 'Blue', 3);
    await component.updateCheckoutQuantity('shirt-1', 'M', 'Blue', 0);

    expect(cartMock.updateQuantity).toHaveBeenCalledTimes(1);
    expect(cartMock.updateQuantity).toHaveBeenCalledWith('shirt-1', 'M', 'Blue', 3);
    expect(cartItems[0].quantity).toBe(3);
  });
});
