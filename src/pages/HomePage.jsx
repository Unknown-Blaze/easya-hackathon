// src/pages/HomePage.jsx
import React from 'react';
// Removed Chakra UI imports
import OrderForm from '../components/OrderForm';
// import mangoImage from '../assets/mango.jpg'; // Ensure you have a mango image in your assets folder
import { Link } from 'react-router-dom'; // Import Link for navigation

// Basic inline styles (you can move these to a CSS file later)
const homePageStyles = {
  pageContainer: { backgroundColor: '#FFF8E1', minHeight: '100vh', padding: '20px 0' }, // Light creamy yellow
  mainContainer: { maxWidth: '1100px', margin: '0 auto', padding: '0 15px' },
  bannerBox: { textAlign: 'center', padding: '20px', marginBottom: '30px', border: '1px solid #FFDAB9', borderRadius: '8px', backgroundColor: 'white' },
  mainHeading: { fontSize: '2.5em', color: '#FF9800', fontFamily: 'Georgia, serif', margin: '0 0 10px 0' }, // Mango Orange
  subText: { fontSize: '1.2em', color: '#333', marginBottom: '0' },
  orderFormBox: { padding: '20px', border: '1px solid #FFDAB9', borderRadius: '8px', backgroundColor: 'white', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' },
  orderFormHeading: { fontSize: '2em', marginBottom: '25px', textAlign: 'center', color: '#4CAF50', fontFamily: 'Georgia, serif' }, // Leaf Green
  footerBox: { textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #eee' },
  footerText: { fontSize: '0.9em', color: '#777' },
  adminLoginLink: { fontSize: '0.8em', color: '#555', marginTop: '10px', display: 'block' } // Example style
};


const HomePage = () => {
  return (
    <div style={homePageStyles.pageContainer}>
      <div style={homePageStyles.mainContainer}>
        <div style={homePageStyles.bannerBox}>
          {/* You can add an <img> tag here for a banner if you have one */}
          {/* <img src="/mango_banner.jpg" alt="Fresh Mangoes" style={{width: '68%', borderRadius: '4px', marginBottom: '15px', height: '130px'}} /> */}
          <h1 style={homePageStyles.mainHeading}>
            Fresh & Juicy Mangoes, Delivered!
          </h1>
          <p style={homePageStyles.subText}>
            Order your favorite mangoes today and taste the sweetness of summer.
          </p>
        </div>

        <div style={homePageStyles.orderFormBox}>
          <h2 style={homePageStyles.orderFormHeading}>
            Place Your Order
          </h2>
          <OrderForm />
        </div>

        <div style={homePageStyles.footerBox}>
          <p style={homePageStyles.footerText}>
            Have questions? Contact me on WhatsApp
          </p>
          <Link to="/admin/login" style={homePageStyles.adminLoginLink}>
          Admin Login
            </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;