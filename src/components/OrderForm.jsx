/* eslint-disable no-unused-vars */
// src/components/OrderForm.jsx
import React, { useState, useEffect, useCallback } from 'react';

import { FaShoppingCart, FaWhatsapp, FaUser, FaMapMarkerAlt, FaTags, FaDollarSign } from 'react-icons/fa';
import { addOrderToFirestore } from '../services/orderService';
import { getAppSettings, getAllPromoCodes } from '../services/settingsService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMemo } from 'react';
import { updatePromoCodeUsage } from '../services/promoCodeService';
import {doc, getDoc} from "firebase/firestore";
import { db } from '../firebase/config';
import { logCustomEvent } from '../utils/analytics'; // Import your custom event logger

// --- STYLES ---
const styles = {
  formContainer: {
    padding: '15px',
    maxWidth: '680px',
    margin: '15px auto',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
  },
  sectionBox: {
    marginBottom: '25px',
    paddingBottom: '20px',
    borderBottom: '1px solid #f0f0f0',
  },
  lastSectionBox: { marginBottom: '25px', paddingBottom: '0px', borderBottom: 'none' },
  heading: {
    fontSize: '1.3em',
    marginBottom: '12px',
    color: '#2c3e50',
    display: 'flex',
    alignItems: 'center',
    fontWeight: 600,
  },
  iconStyle: { marginRight: '10px', color: '#FF9800' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '12px' },
  formControl: { marginBottom: '12px' },
  label: { display: 'block', marginBottom: '4px', fontWeight: '500', color: '#34495e', fontSize: '0.95em' },
  input: { width: '100%', padding: '9px', border: '1px solid #bdc3c7', borderRadius: '4px', boxSizing: 'border-box', fontSize: '0.95em' },
  select: { width: '100%', padding: '9px', border: '1px solid #bdc3c7', borderRadius: '4px', boxSizing: 'border-box', backgroundColor: 'white', fontSize: '0.95em' },
  textarea: { width: '100%', padding: '9px', border: '1px solid #bdc3c7', borderRadius: '4px', boxSizing: 'border-box', minHeight: '70px', fontSize: '0.95em' },
  button: { width: '100%', padding: '12px 15px', backgroundColor: '#e67e22', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1.05em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '500', transition: 'background-color 0.2s ease' },
  buttonIcon: { marginRight: '8px' },
  buttonDisabled: { backgroundColor: '#bdc3c7', color: '#7f8c8d', cursor: 'not-allowed' },
  helperText: { fontSize: '0.85em', color: '#7f8c8d', marginTop: '3px' },
  summaryBox: { backgroundColor: '#f9fafb', padding: '12px', borderRadius: '4px', border: '1px solid #ecf0f1' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.95em' },
  summaryTotal: { fontWeight: 'bold', fontSize: '1.15em', color: '#27ae60' },
  mangoItemBox: {
    border: '1px solid #ecf0f1', padding: '12px', borderRadius: '4px', backgroundColor: 'white',
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  mangoItemImage: { width: '100%', maxHeight: '110px', objectFit: 'cover', borderRadius: '3px', marginBottom: '8px' },
  mangoItemHeading: { fontSize: '1.1em', color: '#e67e22', marginBottom: '4px', fontWeight: 600 },
  mangoPriceText: { fontSize: '0.9em', color: '#34495e', marginBottom: '8px' },
  unavailableOverlay: { position: 'relative', opacity: 0.6, backgroundColor: '#f5f6fa', pointerEvents: 'none' },
  unavailableText: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'rgba(44, 62, 80, 0.75)', color: 'white', padding: '6px 10px', borderRadius: '3px', fontWeight: 'bold', zIndex: 1, textAlign: 'center', fontSize: '0.9em' },
  inputUnavailable: { textAlign: 'center', padding: '10px 0', color: '#7f8c8d', fontWeight: '500', fontSize: '0.9em', minHeight: '37px' },
  loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', flexDirection: 'column', color: '#333' },
  spinner: { border: '4px solid #ecf0f1', borderTop: '4px solid #e67e22', borderRadius: '50%', width: '35px', height: '35px', animation: 'spin 1s linear infinite', marginBottom: '12px' },
  originalPrice: { textDecoration: 'line-through', color: '#888', fontSize: '0.85em', marginLeft: '8px' },
  discountedPrice: { fontWeight: 'bold', color: '#e67e22' },
  savingsTextItem: { fontSize: '0.8em', color: '#28a745', display: 'block', marginTop: '2px', fontWeight: '500' }, // For actual savings on items in cart
  potentialSavingsText: { fontSize: '0.8em', color: '#17a2b8', display: 'block', marginTop: '2px', fontWeight: '500' }, // For indicating potential discount

  promoInputGroup: { display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px' },
  promoApplyButton: { width: 'auto', backgroundColor: '#17a2b8', padding: '9px 15px', fontSize: '0.95em' },
  promoFeedback: { marginTop: '8px', fontSize: '0.9em', fontWeight: '500' },
  promoSuccess: { color: '#28a745' },
  promoError: { color: '#dc3545' },

  summaryDiscountRow: { color: '#28a745', fontWeight: '500' },
  summaryOriginalSubtotal: { textDecoration: 'line-through', color: '#888', fontSize: '0.9em', marginLeft: '10px' }
};

const TELEGRAM_BOT_TOKEN = 'redacted';
const TELEGRAM_CHAT_ID = '620890509';

const FALLBACK_MOMS_WHATSAPP_NUMBER = "60123456789";

const OrderForm = ({ initialCustomerData = null, isAdminPlacingOrder = false, onAdminOrderSuccess = () => {} }) => {
  const navigate = useNavigate();
  const { currentUser, currentUserProfile } = useAuth();

  const [customerDetails, setCustomerDetails] = useState({ name: '', phone: '', unitNo: '', address: '', area: '' });
  const [mangoQuantities, setMangoQuantities] = useState({});
  const [deliveryType, setDeliveryType] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromoDetails, setAppliedPromoDetails] = useState(null);
  const [promoFeedbackMsg, setPromoFeedbackMsg] = useState('');
  const [isPromoLoading, setIsPromoLoading] = useState(false);
  const [allPromoCodes, setAllPromoCodes] = useState([]);

  const [appSettings, setAppSettings] = useState({
    mangoTypes: [], deliveryOptions: [], areas: [], defaultGrabFee: 0,
    momsPhoneNumber: FALLBACK_MOMS_WHATSAPP_NUMBER, paymentMethods: [], bankDetails: ''
  });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    logCustomEvent('view_order_form', { page_title: 'Mango Order Form' });
  }, []); // Log once when the component mounts

  useEffect(() => {
    const savedDetails = localStorage.getItem('customerDetails');
    if (savedDetails) setCustomerDetails(JSON.parse(savedDetails));
  }, []);

  useEffect(() => {
    if (initialCustomerData) {
      setCustomerDetails({
        name: initialCustomerData.name || '', phone: initialCustomerData.phone || '',
        unitNo: initialCustomerData.unitNo || '', address: initialCustomerData.address || '',
        area: initialCustomerData.area || '',
      });
      if (initialCustomerData.paymentMethodId && appSettings.paymentMethods.some(pm => pm.id === initialCustomerData.paymentMethodId)) {
        setPaymentMethod(initialCustomerData.paymentMethodId);
      }
      if (initialCustomerData.deliveryTypeId && appSettings.deliveryOptions.some(d => d.id === initialCustomerData.deliveryTypeId)) {
        setDeliveryType(initialCustomerData.deliveryTypeId);
      }
    } else if (currentUser && currentUserProfile && !isAdminPlacingOrder) {
      setCustomerDetails(prev => ({
        ...prev, name: currentUserProfile.displayName || prev.name || '',
        phone: currentUserProfile.phone || prev.phone || '',
        unitNo: currentUserProfile.defaultAddress?.unitNo || prev.unitNo || '',
        address: currentUserProfile.defaultAddress?.address || prev.address || '',
        area: currentUserProfile.defaultAddress?.area || prev.area || '',
      }));
      if (currentUserProfile.preferredPaymentMethodId && appSettings.paymentMethods.some(pm => pm.id === currentUserProfile.preferredPaymentMethodId)) {
        setPaymentMethod(currentUserProfile.preferredPaymentMethodId);
      }
      if (currentUserProfile.preferredDeliveryTypeId && appSettings.deliveryOptions.some(d => d.id === currentUserProfile.preferredDeliveryTypeId)) {
        setDeliveryType(currentUserProfile.preferredDeliveryTypeId);
      }
    } else if (!isAdminPlacingOrder) {
      const savedDetails = localStorage.getItem('customerDetails');
      if (savedDetails) setCustomerDetails(JSON.parse(savedDetails));
    }
  }, [initialCustomerData, currentUser, currentUserProfile, appSettings.paymentMethods, appSettings.deliveryOptions, isAdminPlacingOrder]);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoadingSettings(true);
      try {
        const [settings, promos] = await Promise.all([getAppSettings(), getAllPromoCodes()]);
        setAllPromoCodes(promos || []);
        if (settings) {
          setAppSettings({
            mangoTypes: settings.mangoTypes || [], deliveryOptions: settings.deliveryOptions || [],
            areas: settings.areas || [], defaultGrabFee: settings.defaultGrabFee || 0,
            momsPhoneNumber: settings.momsPhoneNumber || FALLBACK_MOMS_WHATSAPP_NUMBER,
            paymentMethods: settings.paymentMethods || [], bankDetails: settings.bankDetails || '',
          });
          const initialQuantities = {};
          (settings.mangoTypes || []).forEach(mango => { initialQuantities[mango.id] = 0; });
          setMangoQuantities(initialQuantities);

          const defaultDelivery = (settings.deliveryOptions || []).find(opt => opt.isDefault) || (settings.deliveryOptions || [])[0];
          if (defaultDelivery && !deliveryType && (!initialCustomerData || !initialCustomerData.deliveryTypeId) && (!currentUserProfile || !currentUserProfile.preferredDeliveryTypeId)) {
            setDeliveryType(defaultDelivery.id);
          }
          const defaultPayment = (settings.paymentMethods || []).find(pm => pm.isDefault) || (settings.paymentMethods || [])[0];
          if (defaultPayment && !paymentMethod && (!initialCustomerData || !initialCustomerData.paymentMethodId) && (!currentUserProfile || !currentUserProfile.preferredPaymentMethodId) ) {
            setPaymentMethod(defaultPayment.id);
          }
        } else {
          console.error("OrderForm: getAppSettings returned undefined or null");
          alert("Error: Could not load product settings.");
        }
      } catch (error) {
        console.error("OrderForm: Error fetching app settings:", error);
        alert("Error: Failed to load app settings.");
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCustomerDetailChange = (e) => {
    const { name, value } = e.target;
    setCustomerDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleMangoQuantityChange = (mangoId, value) => {
    const quantity = parseInt(value, 10) || 0;
    setMangoQuantities((prev) => ({ ...prev, [mangoId]: Math.max(0, quantity) }));
  };

  const handlePopulateFromProfile = () => {
    if (currentUserProfile) {
        setCustomerDetails({
            name: currentUserProfile.displayName || '', phone: currentUserProfile.phone || '',
            unitNo: currentUserProfile.defaultAddress?.unitNo || '',
            address: currentUserProfile.defaultAddress?.address || '',
            area: currentUserProfile.defaultAddress?.area || '',
        });
        if (currentUserProfile.preferredPaymentMethodId && appSettings.paymentMethods.some(pm => pm.id === currentUserProfile.preferredPaymentMethodId)) {
            setPaymentMethod(currentUserProfile.preferredPaymentMethodId);
        }
        if (currentUserProfile.preferredDeliveryTypeId && appSettings.deliveryOptions.some(d => d.id === currentUserProfile.preferredDeliveryTypeId)) {
            setDeliveryType(currentUserProfile.preferredDeliveryTypeId);
        }
    } else {
        alert("No profile data found to populate.");
    }
  };

  const orderedItemsWithPrice = useMemo(() => {
    return (appSettings.mangoTypes || [])
      .filter(mango => mangoQuantities[mango.id] > 0 && typeof mango.price === 'number' && mango.available)
      .map(mango => {
        const quantity = mangoQuantities[mango.id] || 0;
        let pricePerBoxApplied = mango.price;
        let discountAppliedPerBox = 0;
        let isDiscountedByPromo = false;

        if (appliedPromoDetails && appliedPromoDetails.isActive) {
          const promo = appliedPromoDetails;
          const applicableItemsArray = Array.isArray(promo.applicableItems) ? promo.applicableItems : [];
          const appliesToThisItem = promo.applicableItems && applicableItemsArray.includes(mango.id);

          if (promo.discountType === "fixed_discount_per_box" && appliesToThisItem) {
            discountAppliedPerBox = promo.discountValue || 0;
            pricePerBoxApplied = Math.max(0, mango.price - discountAppliedPerBox);
            isDiscountedByPromo = discountAppliedPerBox > 0;
          }
        }
        return {
          id: mango.id, name: mango.name, quantity: quantity,
          originalPricePerBox: mango.price, pricePerBoxApplied: pricePerBoxApplied,
          discountAppliedPerBox: discountAppliedPerBox, isDiscountedByPromo: isDiscountedByPromo,
          kgPerBox: mango.kg || 0, itemTotal: quantity * pricePerBoxApplied,
        };
      });
  }, [appSettings.mangoTypes, mangoQuantities, appliedPromoDetails]);

  const mangoSubtotalOriginal = useMemo(() => {
    return orderedItemsWithPrice.reduce((sum, item) => sum + (item.quantity * item.originalPricePerBox), 0);
  }, [orderedItemsWithPrice]);

  const mangoSubtotalAfterItemDiscounts = useMemo(() => {
    return orderedItemsWithPrice.reduce((sum, item) => sum + item.itemTotal, 0);
  }, [orderedItemsWithPrice]);

   const totalPromoDiscountAmount = useMemo(() => {
    if (!appliedPromoDetails || !appliedPromoDetails.isActive ) return 0;

    let calculatedDiscount = 0;
    const promo = appliedPromoDetails;

    if (promo.discountType === "fixed_discount_per_box") {
      calculatedDiscount = orderedItemsWithPrice.reduce((sum, item) => {
        if (item.isDiscountedByPromo) {
          return sum + (item.quantity * item.discountAppliedPerBox);
        }
        return sum;
      }, 0);
    } else if (promo.discountType === "percentage_total") {
      const baseForPercentage = mangoSubtotalAfterItemDiscounts;
      calculatedDiscount += (baseForPercentage * (promo.discountValue || 0)) / 100;
    } else if (promo.discountType === "fixed_amount_total") {
      if (orderedItemsWithPrice.length > 0) {
        calculatedDiscount += (promo.discountValue || 0);
      } else {
        return 0; 
      }
    }
    
    const relevantSubtotalForCap = promo.discountType === "fixed_discount_per_box" ? mangoSubtotalOriginal : mangoSubtotalAfterItemDiscounts;
    const finalDiscount = Math.min(calculatedDiscount, relevantSubtotalForCap > 0 ? relevantSubtotalForCap : 0 );
    
    return isNaN(finalDiscount) || typeof finalDiscount === 'undefined' ? 0 : finalDiscount;

  }, [appliedPromoDetails, mangoSubtotalOriginal, mangoSubtotalAfterItemDiscounts, orderedItemsWithPrice]);


  const finalMangoSubtotal = useMemo(() => {
    let subtotal;
    if (appliedPromoDetails?.discountType === "fixed_discount_per_box") {
        subtotal = mangoSubtotalAfterItemDiscounts;
    } else {
        subtotal = mangoSubtotalOriginal - totalPromoDiscountAmount;
    }
    // Ensure it's always a number, default to 0 if NaN or undefined
    return isNaN(subtotal) || typeof subtotal === 'undefined' ? 0 : subtotal;
  }, [mangoSubtotalOriginal, mangoSubtotalAfterItemDiscounts, totalPromoDiscountAmount, appliedPromoDetails]);


  const deliveryCost = useCallback(() => {
    const selectedOption = (appSettings.deliveryOptions || []).find(opt => opt.id === deliveryType);
    if (!selectedOption) return 0;
    if (selectedOption.id !== 'pickup' && customerDetails.area) {
        const areaSetting = (appSettings.areas || []).find(a => a.name.toLowerCase() === customerDetails.area.toLowerCase());
        if (areaSetting) {
            if (selectedOption.id === 'grab' && areaSetting.deliveryFeeGrab !== undefined) return areaSetting.deliveryFeeGrab;
            if (selectedOption.id === 'lalamove' && areaSetting.deliveryFeeLalamove !== undefined) return areaSetting.deliveryFeeLalamove;
        }
        return selectedOption.baseFee || appSettings.defaultGrabFee || 0;
    }
    return selectedOption.baseFee || 0;
  }, [deliveryType, appSettings.deliveryOptions, appSettings.areas, customerDetails.area, appSettings.defaultGrabFee])();

  const grandTotal = useMemo(() => {
      return finalMangoSubtotal + deliveryCost;
  }, [finalMangoSubtotal, deliveryCost]);

  const handleApplyPromoCode = async () => {
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) { setPromoFeedbackMsg("Please enter a promo code."); setAppliedPromoDetails(null); return; }
    setIsPromoLoading(true); setPromoFeedbackMsg(''); setAppliedPromoDetails(null);

    const promoDataFromList = (allPromoCodes || []).find(p => p.code === code);

    if (promoDataFromList) {
        const livePromoRef = doc(db, "promoCodes", promoDataFromList.id);
        const livePromoSnap = await getDoc(livePromoRef);

        if (!livePromoSnap.exists()) {
            setPromoFeedbackMsg("Promo code details not found.");
            setIsPromoLoading(false);
            return;
        }
        const promoData = { id: livePromoSnap.id, ...livePromoSnap.data() };

        let errorMessage = "";
        // Calculate subtotal based on current cart items for minOrderAmount check
        const currentCartSubtotalForMinOrderCheck = orderedItemsWithPrice.reduce((sum, item) => sum + (item.quantity * item.originalPricePerBox), 0);


        if (!promoData.isActive) errorMessage = "This promo code is not active.";
        else if (promoData.loggedInOnly && !currentUser) errorMessage = "You must be logged in to use this code.";
        else if (promoData.validFrom && new Date(promoData.validFrom.toDate()) > new Date()) errorMessage = "This promo code is not yet valid.";
        else if (promoData.validUntil && new Date(promoData.validUntil.toDate()) < new Date()) errorMessage = "This promo code has expired.";
        // --- MODIFIED: Min order amount check now uses currentCartSubtotalForMinOrderCheck ---
        else if (promoData.minOrderAmount && currentCartSubtotalForMinOrderCheck < promoData.minOrderAmount) {
            errorMessage = `Minimum order of RM ${promoData.minOrderAmount.toFixed(2)} (before this discount) required. Your current subtotal is RM ${currentCartSubtotalForMinOrderCheck.toFixed(2)}.`;
        }
        else if (promoData.usageLimit && promoData.usageLimit > 0 && (promoData.timesUsed || 0) >= promoData.usageLimit) {
            errorMessage = "This promo code has reached its usage limit.";
        }
        else if (promoData.onePerCustomer && currentUser && promoData.usedByUsers && promoData.usedByUsers.includes(currentUser.uid)) {
            errorMessage = "You have already used this promo code.";
        }
        // --- REMOVED: Check for applicable items in cart to allow applying the code anyway ---
        // if (promoData.discountType === "fixed_discount_per_box") {
        //     const applicableItemsInCart = orderedItemsWithPrice.some(item =>
        //         Array.isArray(promoData.applicableItems) && promoData.applicableItems.includes(item.id)
        //     );
        //     if (!applicableItemsInCart && orderedItemsWithPrice.length > 0) {
        //          errorMessage = `This promo code applies to specific mango types not currently in your cart, or your cart is empty.`;
        //     } else if (orderedItemsWithPrice.length === 0 && promoData.minOrderAmount > 0) { // Only error if cart empty AND min order exists
        //          errorMessage = `Your cart is empty. Add items to use this promo. Min order RM ${promoData.minOrderAmount.toFixed(2)}.`;
        //     }
        // }

        if (errorMessage) {
            setPromoFeedbackMsg(errorMessage);
        } else {
            setAppliedPromoDetails(promoData);
            setPromoFeedbackMsg(promoData.description || `Promo "${promoData.code}" applied! Discount will reflect on eligible items.`);
        }
    } else {
        setPromoFeedbackMsg("Invalid promo code.");
    }
    setIsPromoLoading(false);
  };

  const handleRemovePromoCode = () => {
    setPromoCodeInput('');
    setAppliedPromoDetails(null);
    setPromoFeedbackMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (orderedItemsWithPrice.length === 0) {
      alert("Empty Cart: Please select some mangoes to order.");
      setIsSubmitting(false); return;
    }
    if (!customerDetails.name || !customerDetails.phone) {
      alert("Missing Information: Please fill in all your details.");
      setIsSubmitting(false); return;
    }
    if (!deliveryType) {
      alert("Missing Delivery Option: Please select a delivery method.");
      setIsSubmitting(false); return;
    }
    if (!paymentMethod) {
      alert("Missing Payment Method: Please select how you'd like to pay.");
      setIsSubmitting(false); return;
    }
    function escapeMarkdownV2(str) {
      return str
        .replace(/[_*[\]()~`>#+=|{}.!\\-]/g, '\\$&'); // escape Telegram MarkdownV2 special chars
    }

    const formatTelegramMessageMarkdownV2 = (rawMsg) => {
      const escaped = escapeMarkdownV2(rawMsg);
      return escaped.replace(/\\\*(.*?)\\\*/g, '*$1*'); // re-apply bold after escaping
    };




    const itemsToSave = orderedItemsWithPrice.map(item => ({
      id: item.id, name: item.name, quantity: item.quantity,
      originalPricePerBox: item.originalPricePerBox, pricePerBoxApplied: item.pricePerBoxApplied,
      discountAppliedPerBox: item.discountAppliedPerBox, isDiscountedByPromo: item.isDiscountedByPromo,
      kgPerBox: item.kgPerBox, itemTotal: item.itemTotal,
    }));

    const orderDetailsToSave = {
      customer: customerDetails, items: itemsToSave,
      userId: isAdminPlacingOrder && initialCustomerData?.userId ? initialCustomerData.userId : (currentUser ? currentUser.uid : null),
      delivery: {
        typeId: deliveryType,
        optionName: (appSettings.deliveryOptions || []).find(opt => opt.id === deliveryType)?.name || deliveryType,
        cost: deliveryCost,
      },
      subtotalBeforeDiscount: mangoSubtotalOriginal,
      discountApplied: appliedPromoDetails && totalPromoDiscountAmount > 0 ? { // Only record if discount amount > 0
        code: appliedPromoDetails.code, description: appliedPromoDetails.description,
        type: appliedPromoDetails.discountType, value: appliedPromoDetails.discountValue,
        amountDeducted: totalPromoDiscountAmount,
      } : null,
      subtotalAfterDiscount: finalMangoSubtotal,
      notes: notes, mangoAmount: finalMangoSubtotal, totalAmount: grandTotal,
      paymentMethodId: paymentMethod,
      paymentMethodName: (appSettings.paymentMethods || []).find(m => m.id === paymentMethod)?.name || paymentMethod,
      placedByAdmin: isAdminPlacingOrder, orderTimestamp: new Date(), orderStatus: "Ordered",
      paymentStatus: { isPaid: false, balance: grandTotal, cash: 0, onlineTransfer: 0 },
    };

    if (!currentUser && !initialCustomerData && !isAdminPlacingOrder) {
        localStorage.setItem('customerDetails', JSON.stringify(customerDetails));
    }

    try {
      const result = await addOrderToFirestore(orderDetailsToSave);
      if (result.success) {
        logCustomEvent('order_placed', {
          user_id: orderDetailsToSave.userId || 'guest',
          total_amount: orderDetailsToSave.totalAmount,
          item_count: orderDetailsToSave.items.length,
          payment_method: orderDetailsToSave.paymentMethodName,
          delivery_type: orderDetailsToSave.delivery.optionName,
          promo_code_used: orderDetailsToSave.discountApplied ? orderDetailsToSave.discountApplied.code : 'none',
        });
        const initialQuantities = {};
        (appSettings.mangoTypes || []).forEach(mango => { initialQuantities[mango.id] = 0; });
        setMangoQuantities(initialQuantities);
        let whatsappMessage = `🥭*New Mango Order!* \n\n*Customer Details:*\nName: ${customerDetails.name}\nPhone: ${customerDetails.phone}\nAddress: ${customerDetails.unitNo ? customerDetails.unitNo + ', ' : ''}${customerDetails.address}, ${customerDetails.area}\n\n*Order Summary:*\n`;
        orderDetailsToSave.items.forEach(item => {
          let priceInfo = `RM ${item.pricePerBoxApplied.toFixed(2)}/box`;
          if (item.isDiscountedByPromo) {
            priceInfo += ` (Promo! Orig: RM ${item.originalPricePerBox.toFixed(2)})`;
          }
          whatsappMessage += `- ${item.name}: ${item.quantity} box${item.quantity > 1 ? 'es' : ''} @ ${priceInfo} = RM ${item.itemTotal.toFixed(2)}\n`;
        });
        
        if (orderDetailsToSave.discountApplied && orderDetailsToSave.discountApplied.amountDeducted > 0) {
          whatsappMessage += `\nSubtotal (Mangoes): RM ${(parseFloat(orderDetailsToSave.subtotalAfterDiscount.toFixed(2)) + parseFloat(orderDetailsToSave.discountApplied.amountDeducted.toFixed(2))).toFixed(2)}\n`;
          whatsappMessage += `Discount (${orderDetailsToSave.discountApplied.code}): -RM ${orderDetailsToSave.discountApplied.amountDeducted.toFixed(2)}\n`;
        }
        whatsappMessage += `Delivery - ${orderDetailsToSave.delivery.optionName}\n`;
        whatsappMessage += `*GRAND TOTAL: RM ${orderDetailsToSave.totalAmount.toFixed(2)}*\n`;
        whatsappMessage += `*Payment by:* ${orderDetailsToSave.paymentMethodName}\n\n`;
        if (notes) whatsappMessage += `*Notes from Customer:*\n${notes}\n\n`;
        whatsappMessage += `Order ID: ${result.appOrderId}\nPlease confirm this order. Thank you!`;

        // --- SEND MESSAGE TO TELEGRAM BOT ---
        const sendTelegramMessage = async (message) => {
            if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID || TELEGRAM_BOT_TOKEN === 'YOUR_TELEGRAM_BOT_TOKEN' || TELEGRAM_CHAT_ID === 'YOUR_TELEGRAM_CHAT_ID') {
                console.warn("Telegram bot token or chat ID not configured. Skipping Telegram notification. Please update TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in OrderForm.jsx");
                return;
            }

            // Convert WhatsApp bold (*text*) to HTML bold (<b>text</b>) for Telegram
            // Newlines (\n) are generally preserved correctly in Telegram's HTML parse_mode.
            // const telegramFormattedMessage = message.replace(/\*(.*?)\*/g, '<b>$1</b>');

            try {
                const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        chat_id: TELEGRAM_CHAT_ID,
                        text: message,
                        parse_mode: 'MarkdownV2' // Use HTML for simple bolding
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error("Failed to send Telegram message:", response.status, errorData);
                    console.error("Telegram API response:", errorData); // Uncomment for more detailed error debugging
                } else {
                    console.log("Telegram message sent successfully!");
                }
            } catch (telegramError) {
                console.error("Error sending Telegram message:", telegramError);
            }
        };
        const telegramFormattedMessage = formatTelegramMessageMarkdownV2(whatsappMessage);
        sendTelegramMessage(telegramFormattedMessage); // Call the Telegram function

        const momsActualPhoneNumber = appSettings.momsPhoneNumber || FALLBACK_MOMS_WHATSAPP_NUMBER;
        const whatsappUrl = `https://wa.me/${momsActualPhoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;

        if (appliedPromoDetails && totalPromoDiscountAmount > 0) { // Only update usage if discount was actually applied
          try {
            await updatePromoCodeUsage(appliedPromoDetails.id, currentUser ? currentUser.uid : null);
          } catch (promoError) {
            console.error("Failed to update promo code usage stats:", promoError);
          }
        }

        if (isAdminPlacingOrder) {
            onAdminOrderSuccess();
            alert("Admin Quick Order Placed Successfully!");
            setCustomerDetails({ name: '', phone: '', unitNo: '', address: '', area: '' });
            const initialQuantities = {};
            (appSettings.mangoTypes || []).forEach(mango => { initialQuantities[mango.id] = 0; });
            setMangoQuantities(initialQuantities);
            setNotes('');
            handleRemovePromoCode();
        } else {
            alert("Order Placed! Your mango order has been successfully submitted. Click OK to confirm on WhatsApp.");
            setTimeout(() => {
              const link = document.createElement('a');
              link.href = whatsappUrl;
              link.target = '_blank';
              link.rel = 'noopener noreferrer';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }, 0); // keep the delay minimal or remove setTimeout altogether
        }
      } else {
          throw new Error(result.error || "Failed to save order to database.");
      }
    } catch (error) {
      console.error("Error submitting order:", error);
      alert(`Submission Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingSettings) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading mango varieties...</p>
      </div>
    );
  }

  return (
    <div style={styles.formContainer}>
      <form onSubmit={handleSubmit}>
        {/* Customer Details Section */}
        <div style={styles.sectionBox}>
          <h3 style={styles.heading}><FaUser style={styles.iconStyle} /> Your Details</h3>
          {currentUser && currentUserProfile && !isAdminPlacingOrder && (
              <button
                  type="button"
                  onClick={handlePopulateFromProfile}
                  style={{ ...styles.button, backgroundColor: '#007bff', width: 'auto', marginBottom: '15px', fontSize: '0.9em', padding: '8px 12px' }}
              >
                  Fill from My Profile
              </button>
          )}
          <div style={styles.grid}>
            <div style={styles.formControl}>
              <label htmlFor="name" style={styles.label}>Full Name*</label>
              <input type="text" id="name" name="name" style={styles.input} value={customerDetails.name} onChange={handleCustomerDetailChange} placeholder="e.g.," required />
            </div>
            <div style={styles.formControl}>
              <label htmlFor="phone" style={styles.label}>Phone Number*</label>
              <input type="tel" id="phone" name="phone" style={styles.input} value={customerDetails.phone} onChange={handleCustomerDetailChange} placeholder="e.g., 0123456789" required />
            </div>
            <div style={styles.formControl}>
              <label htmlFor="unitNo" style={styles.label}>Unit No / House No</label>
              <input type="text" id="unitNo" name="unitNo" style={styles.input} value={customerDetails.unitNo} onChange={handleCustomerDetailChange} placeholder="e.g., A-12-03 or No. 28" />
            </div>
            <div style={styles.formControl}>
              <label htmlFor="address" style={styles.label}>Condo / Street Address</label>
              <input type="text" id="address" name="address" style={styles.input} value={customerDetails.address} onChange={handleCustomerDetailChange} placeholder="e.g., Kiara Residence or Jalan Mango" />
            </div>
            <div style={styles.formControl}>
              <label htmlFor="area" style={styles.label}>Area / City</label>
              <input type="text" id="area" name="area" style={styles.input} value={customerDetails.area} onChange={handleCustomerDetailChange} placeholder="e.g., Mont Kiara or Bangsar" />
              <p style={styles.helperText}>Delivery fee may vary based on Grab / Lalamove fees.</p>
            </div>
          </div>
        </div>

    {/* Mango Selection Section - UPDATED FOR NEW PRICE DISPLAY */}
    <div style={styles.sectionBox}>
        <h3 style={styles.heading}><FaShoppingCart style={styles.iconStyle} /> Choose Your Mangoes</h3>
        {(appSettings.mangoTypes || []).length > 0 ? (
            <div style={styles.grid}>
                {(appSettings.mangoTypes || []).map((mango) => {
                    const isAvailable = mango.available;
                    const itemBoxStyle = isAvailable ? styles.mangoItemBox : { ...styles.mangoItemBox, ...styles.unavailableOverlay };

                    // --- MODIFIED PRICE DISPLAY LOGIC ---
                    let displayPrice = mango.price;
                    let originalDisplayPrice = null;
                    let potentialSavingsText = null; // For display on product card
                    let actualSavingsText = null;    // For items in cart

                    const currentItemData = orderedItemsWithPrice.find(item => item.id === mango.id);

                    // Check if the applied promo is for fixed_discount_per_box and applies to this mango
                    if (appliedPromoDetails && appliedPromoDetails.isActive &&
                        appliedPromoDetails.discountType === "fixed_discount_per_box" &&
                        Array.isArray(appliedPromoDetails.applicableItems) &&
                        appliedPromoDetails.applicableItems.includes(mango.id) &&
                        (appliedPromoDetails.discountValue || 0) > 0
                        ) {
                          const discountValue = appliedPromoDetails.discountValue;
                          originalDisplayPrice = mango.price;
                          displayPrice = Math.max(0, mango.price - discountValue);
                          potentialSavingsText = `Promo: Save RM ${discountValue.toFixed(2)}/box!`;

                          // If item is also in cart (currentItemData exists), show actual savings for that line
                          if (currentItemData && currentItemData.isDiscountedByPromo) {
                              actualSavingsText = `Saved RM ${currentItemData.discountAppliedPerBox.toFixed(2)} per box!`;
                              // The displayPrice and originalDisplayPrice are already set correctly by the above block
                              // for product card. For cart items, orderedItemsWithPrice handles it.
                          }
                    } else if (currentItemData && currentItemData.isDiscountedByPromo) {
                        // This handles other promo types that might discount an item (not currently implemented but good for future)
                        // Or if the fixed_discount_per_box logic above didn't catch it but orderedItemsWithPrice did.
                        displayPrice = currentItemData.pricePerBoxApplied;
                        originalDisplayPrice = currentItemData.originalPricePerBox;
                        actualSavingsText = `Saved RM ${currentItemData.discountAppliedPerBox.toFixed(2)} per box!`;
                    }

                    return (
                        <div key={mango.id} style={itemBoxStyle}>
                            {mango.imageUrl && (
                                <img src={mango.imageUrl} alt={mango.name} style={styles.mangoItemImage} onError={(e) => e.target.src = '/mango.jpg'} />
                            )}
                            <h4 style={styles.mangoItemHeading}>{mango.name}</h4>
                            <p style={styles.mangoPriceText}>
                                {originalDisplayPrice !== null && typeof originalDisplayPrice === 'number' && originalDisplayPrice !== displayPrice && (
                                    <span style={styles.originalPrice}>
                                        RM {originalDisplayPrice.toFixed(2)}
                                    </span>
                                )}
                                <span style={(originalDisplayPrice !== null && originalDisplayPrice !== displayPrice) ? styles.discountedPrice : {}}>
                                     RM {typeof displayPrice === 'number' ? displayPrice.toFixed(2) : 'N/A'} per box
                                </span>

                                {/* Show potential savings text if promo is applied and eligible, OR actual savings if item in cart */}
                                {actualSavingsText && (
                                    <span style={styles.savingsTextItem}>
                                        {actualSavingsText}
                                    </span>
                                )}
                                {!actualSavingsText && potentialSavingsText && ( // Show potential only if no actual savings shown
                                    <span style={styles.potentialSavingsText}>
                                        {potentialSavingsText}
                                    </span>
                                )}

                                {typeof mango.kg === 'number' && mango.kg > 0 && (
                                    <span style={{ fontSize: '0.85em', color: '#555', display: 'block' }}>
                                        (approx. {mango.kg}kg per box)
                                    </span>
                                )}
                            </p>
                            {isAvailable ? (
                                <div>
                                    <label htmlFor={`mango-${mango.id}`} style={styles.label} className="sr-only">{`Quantity for ${mango.name}`}</label>
                                    <input
                                        type="number"
                                        id={`mango-${mango.id}`}
                                        style={styles.input}
                                        value={mangoQuantities[mango.id] || 0}
                                        min="0" max="20"
                                        onChange={(e) => handleMangoQuantityChange(mango.id, e.target.value)}
                                        placeholder="Quantity (boxes)"
                                    />
                                </div>
                            ) : (
                                <div style={styles.inputUnavailable}>Currently Unavailable</div>
                            )}
                            {!isAvailable && <div style={styles.unavailableText}>Out of Stock</div>}
                        </div>
                    );
                })}
            </div>
        ) : (
            <p>No mangoes currently available. Please check back later!</p>
        )}
    </div>

        {/* Delivery and Notes Section */}
        <div style={styles.sectionBox}>
          <h3 style={styles.heading}><FaMapMarkerAlt style={styles.iconStyle} /> Delivery & Notes</h3>
          <div style={styles.grid}>
            <div style={styles.formControl}>
              <label htmlFor="deliveryType" style={styles.label}>Delivery Option*</label>
              <select id="deliveryType" style={styles.select} value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)} required >
                <option value="" disabled>Select delivery option</option>
                {(appSettings.deliveryOptions || []).map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name} {option.baseFee > 0 && `(RM ${option.baseFee.toFixed(2)})`}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.formControl}>
              <label htmlFor="notes" style={styles.label}>Optional Notes for Seller</label>
              <textarea id="notes" style={styles.textarea} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g., Special instructions, Will collect tomorrow, etc." />
            </div>
          </div>
        </div>

        {/* Payment Method Section */}
        <div style={styles.sectionBox}>
          <h3 style={styles.heading}>Payment Method</h3>
          <div style={styles.formControl}>
            <label htmlFor="paymentMethod" style={styles.label}>Select Payment Method*</label>
            <select id="paymentMethod" style={styles.select} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} required >
              <option value="" disabled>Choose how you'll pay</option>
              {(appSettings.paymentMethods || []).map((method) => (
                <option key={method.id} value={method.id}>{method.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Promo Code Section */}
        <div style={styles.sectionBox}>
          <h3 style={styles.heading}><FaTags style={styles.iconStyle} /> Promo Code</h3>
          <div style={styles.promoInputGroup}>
            <input
              type="text" style={styles.input} placeholder="Enter promo code"
              value={promoCodeInput} onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
              disabled={!!appliedPromoDetails || isPromoLoading}
            />
            {!appliedPromoDetails ? (
              <button type="button" onClick={handleApplyPromoCode} style={{ ...styles.button, ...styles.promoApplyButton }} disabled={isPromoLoading || !promoCodeInput.trim()}>
                {isPromoLoading ? 'Verifying...' : 'Apply'}
              </button>
            ) : (
              <button type="button" onClick={handleRemovePromoCode} style={{ ...styles.button, backgroundColor: '#777', width: 'auto', padding: '9px 15px', fontSize: '0.95em' }}>
                Remove Code ({appliedPromoDetails.code})
              </button>
            )}
          </div>
          {promoFeedbackMsg && (
            <p style={{ ...styles.promoFeedback, color: appliedPromoDetails && (promoFeedbackMsg.includes("applied") || promoFeedbackMsg.includes(appliedPromoDetails.description)) ? styles.promoSuccess.color : styles.promoError.color }}>
              {promoFeedbackMsg}
            </p>
          )}
        </div>

        {/* Order Summary Section */}
        <div style={{...styles.sectionBox, ...styles.lastSectionBox}}>
            <h3 style={styles.heading}><FaDollarSign style={styles.iconStyle} /> Order Summary</h3>
            <div style={styles.summaryBox}>
                {orderedItemsWithPrice.map(item => (
                    <div key={item.id} style={styles.summaryRow}>
                        <span>
                            {item.name} ({item.quantity} box{item.quantity > 1 ? 'es' : ''})
                            {item.isDiscountedByPromo && item.discountAppliedPerBox > 0 &&
                                <span style={{fontSize:'0.8em', color:'green', marginLeft: '5px'}}>
                                  (Saved RM {item.discountAppliedPerBox.toFixed(2)}/box)
                                </span>
                            }
                        </span>
                        <span>
                            {item.isDiscountedByPromo && item.originalPricePerBox !== item.pricePerBoxApplied &&
                                <span style={{...styles.originalPrice, fontSize: '0.9em', marginRight: '5px'}}>
                                    RM {(item.originalPricePerBox * item.quantity).toFixed(2)}
                                </span>
                            }
                            RM {item.itemTotal.toFixed(2)}
                        </span>
                    </div>
                ))}

                {orderedItemsWithPrice.length > 0 && <hr style={{ margin: '10px 0', borderColor: '#eee' }} />}

                {orderedItemsWithPrice.length > 0 && (
                  <>
                    <div style={styles.summaryRow}>
                        <span>Subtotal (Original Mango Value):</span>
                        <span style={totalPromoDiscountAmount > 0 ? styles.summaryOriginalSubtotal : {}} >
                            RM {mangoSubtotalOriginal.toFixed(2)}
                        </span>
                    </div>

                    {totalPromoDiscountAmount > 0 && appliedPromoDetails && (
                        <div style={{...styles.summaryRow, ...styles.summaryDiscountRow}}>
                            <span>Promo Discount ({appliedPromoDetails.code}):</span>
                            <span>- RM {totalPromoDiscountAmount.toFixed(2)}</span>
                        </div>
                    )}

                    <div style={{...styles.summaryRow, fontWeight: '500' }}>
                        <span>Subtotal (Mangoes After Discount):</span>
                        <span>RM {finalMangoSubtotal.toFixed(2)}</span>
                    </div>
                  </>
                )}
                 {(orderedItemsWithPrice.length === 0 && appliedPromoDetails) && (
                    <p style={{textAlign: 'center', color: styles.iconStyle.color, margin: '10px 0'}}>
                        Promo "{appliedPromoDetails.code}" is active! Add eligible items to see discounts.
                    </p>
                )}


                <div style={styles.summaryRow}>
                    <span>Delivery Cost:</span>
                    <span>RM {deliveryCost.toFixed(2)}</span>
                </div>
                <hr style={{ margin: '10px 0', borderStyle: 'dashed', borderColor: '#ccc' }} />
                <div style={{...styles.summaryRow, ...styles.summaryTotal}}>
                    <span>Grand Total:</span>
                    <span>RM {grandTotal.toFixed(2)}</span>
                </div>
                 {appSettings.bankDetails && paymentMethod === 'bank_transfer' && (
                    <div style={{marginTop: '15px', fontSize: '0.9em', padding: '10px', backgroundColor: '#e9f7ef', borderRadius: '4px'}}>
                        <p style={{fontWeight: 'bold', color: '#155724'}}>Bank Transfer Details:</p>
                        <pre style={{whiteSpace: 'pre-wrap', margin: 0, color: '#155724'}}>{appSettings.bankDetails}</pre>
                    </div>
                )}
            </div>
        </div>

        <button
          type="submit"
          style={isSubmitting || orderedItemsWithPrice.length === 0 || !deliveryType || !paymentMethod ? {...styles.button, ...styles.buttonDisabled} : styles.button}
          disabled={isSubmitting || orderedItemsWithPrice.length === 0 || !deliveryType || !paymentMethod}
        >
          {isSubmitting ? 'Placing Order...' : <><FaWhatsapp style={styles.buttonIcon} /> Place Order & Confirm on WhatsApp</>}
        </button>
      </form>
      <style jsx global>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0; }
      `}</style>
    </div>
  );
};

export default OrderForm;