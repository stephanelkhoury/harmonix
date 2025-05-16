import React from 'react';
import './Contact.css';

const Contact = () => {
  return (
    <section className="contact-section container">
      <h1 className="text-center">Contact Us</h1>
      <p className="text-center">Have a question, idea, or collaboration request? We're listening.</p>

      <div className="contact-grid">
        <div className="contact-info">
          <h2>Reach Us</h2>
          <p><strong>Email:</strong> hello@harmonix.ai</p>
          <p><strong>Support:</strong> support@harmonix.ai</p>
          <p><strong>Phone:</strong> +961 78 965 292</p>
          <p><strong>Address:</strong> Beirut, Lebanon</p>
        </div>

        <div className="contact-form">
          <form id="contact-form">
            <label htmlFor="name">Your Name *</label>
            <input type="text" id="name" name="name" required />

            <label htmlFor="email">Your Email *</label>
            <input type="email" id="email" name="email" required />

            <label htmlFor="subject">Subject</label>
            <input type="text" id="subject" name="subject" />

            <label htmlFor="message">Your Message *</label>
            <textarea id="message" name="message" rows="6" required></textarea>

            <button type="submit">Send Message</button>
          </form>
        </div>
      </div>

      <div className="social-links text-center">
        <p>Follow us:</p>
        <a href="https://instagram.com/harmonix.ai" target="_blank" rel="noopener noreferrer">Instagram</a>
        <a href="https://youtube.com/@harmonixai" target="_blank" rel="noopener noreferrer">YouTube</a>
        <a href="https://linkedin.com/company/harmonixai" target="_blank" rel="noopener noreferrer">LinkedIn</a>
      </div>
    </section>
  );
};

export default Contact;