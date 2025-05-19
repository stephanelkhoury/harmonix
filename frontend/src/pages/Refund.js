import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const Refund = () => {
    return (
        <Container className="py-5">
            <Row className="justify-content-center">
                <Col md={10}>
                    <h1 className="mb-4">Refund Policy</h1>
                    <div className="card">
                        <div className="card-body">
                            <h2>1. Overview</h2>
                            <p>
                                At Harmonix, we strive to ensure our customers are satisfied with their purchases. 
                                This Refund Policy outlines the terms and conditions for refunds and cancellations 
                                of our services and subscriptions.
                            </p>

                            <h2>2. Subscription Cancellations</h2>
                            <p>
                                You may cancel your subscription at any time by:
                            </p>
                            <ul>
                                <li>Logging into your account and navigating to the Subscription Management section</li>
                                <li>Contacting our customer support team via email at support@harmonix.ai</li>
                            </ul>
                            <p>
                                When you cancel a subscription:
                            </p>
                            <ul>
                                <li>You will continue to have access to the service until the end of your current billing period</li>
                                <li>Your subscription will not auto-renew after the current billing period ends</li>
                                <li>No partial refunds are provided for the unused portion of the current billing period</li>
                            </ul>

                            <h2>3. Refund Eligibility</h2>
                            <h3>3.1 Monthly Subscriptions</h3>
                            <p>
                                For monthly subscription plans, we offer a 7-day money-back guarantee period. If you are not 
                                satisfied with our service, you may request a full refund within 7 days of your initial purchase.
                            </p>

                            <h3>3.2 Annual Subscriptions</h3>
                            <p>
                                For annual subscription plans, we offer a 14-day money-back guarantee period. If you are not 
                                satisfied with our service, you may request a full refund within 14 days of your initial purchase.
                            </p>

                            <h3>3.3 Exclusions</h3>
                            <p>
                                Refunds are not available for:
                            </p>
                            <ul>
                                <li>Subscription renewals (only initial purchases are eligible)</li>
                                <li>Accounts that have violated our Terms of Service</li>
                                <li>Requests made after the guarantee period has expired</li>
                                <li>Special promotional offers that were explicitly marked as non-refundable</li>
                            </ul>

                            <h2>4. How to Request a Refund</h2>
                            <p>
                                To request a refund:
                            </p>
                            <ol>
                                <li>Email our support team at refunds@harmonix.ai</li>
                                <li>Include your account email address and order information</li>
                                <li>Briefly explain the reason for your refund request</li>
                            </ol>
                            <p>
                                We aim to process all refund requests within 5 business days. Once approved, please allow 
                                7-14 business days for the refund to appear on your original payment method.
                            </p>

                            <h2>5. Pro-rated Refunds</h2>
                            <p>
                                In exceptional circumstances, such as extended service outages or technical issues that 
                                significantly impair your use of our service, we may offer pro-rated refunds at our discretion.
                                These cases will be evaluated on an individual basis.
                            </p>

                            <h2>6. Changes to This Policy</h2>
                            <p>
                                We reserve the right to modify this Refund Policy at any time. Changes will be effective 
                                immediately upon posting on our website, but will not apply retroactively to purchases made 
                                before the changes.
                            </p>

                            <h2>7. Contact Information</h2>
                            <p>
                                If you have any questions about our Refund Policy, please contact us at:
                                <br />
                                Email: billing@harmonix.ai
                                <br />
                                Address: Beirut, Lebanon
                                <br />
                                Support Hours: Monday-Friday, 9am-5pm EST
                            </p>

                            <p className="text-muted mt-4">Last Updated: May 18, 2025</p>
                        </div>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default Refund;
