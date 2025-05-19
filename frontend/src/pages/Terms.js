import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const Terms = () => {
    return (
        <Container className="py-5">
            <Row className="justify-content-center">
                <Col md={10}>
                    <h1 className="mb-4">Terms of Service</h1>
                    <div className="card">
                        <div className="card-body">
                            <h2>1. Acceptance of Terms</h2>
                            <p>
                                By accessing or using the Harmonix service, website, and software (collectively, the "Service"), 
                                you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, 
                                you may not access or use the Service.
                            </p>

                            <h2>2. Description of Service</h2>
                            <p>
                                Harmonix provides AI-powered chord detection and analysis tools for musicians and music producers.
                                We may modify, update, or discontinue any aspect of our Service at any time.
                            </p>

                            <h2>3. User Accounts</h2>
                            <p>
                                To access certain features of the Service, you may be required to create an account. You are responsible 
                                for maintaining the confidentiality of your account information and for all activities that occur under 
                                your account. You agree to notify us immediately of any unauthorized use of your account.
                            </p>

                            <h2>4. User Content</h2>
                            <p>
                                Our Service allows you to upload, store, and analyze audio content. You retain all rights to your content, 
                                but by uploading content to our Service, you grant Harmonix a non-exclusive, royalty-free license to use, 
                                store, and process that content solely for the purpose of providing and improving the Service to you.
                            </p>

                            <h2>5. Acceptable Use</h2>
                            <p>
                                You agree not to use the Service to:
                            </p>
                            <ul>
                                <li>Violate any laws or regulations</li>
                                <li>Infringe upon intellectual property rights of others</li>
                                <li>Transmit harmful code or attempt to breach our security measures</li>
                                <li>Upload or share content that is illegal, offensive, or violates the rights of others</li>
                                <li>Use the Service in any way that could damage or overburden our systems</li>
                            </ul>

                            <h2>6. Subscription and Payment</h2>
                            <p>
                                Some aspects of the Service may be offered on a subscription basis. By subscribing, you agree to pay 
                                the fees as described at the time of purchase. Subscriptions automatically renew unless canceled before 
                                the renewal date.
                            </p>

                            <h2>7. Termination</h2>
                            <p>
                                We reserve the right to suspend or terminate your access to the Service at any time for any reason, 
                                including but not limited to a violation of these Terms.
                            </p>

                            <h2>8. Disclaimer of Warranties</h2>
                            <p>
                                THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. HARMONIX EXPRESSLY DISCLAIMS ALL 
                                WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES 
                                OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                            </p>

                            <h2>9. Limitation of Liability</h2>
                            <p>
                                IN NO EVENT SHALL HARMONIX BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE 
                                DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, 
                                RESULTING FROM YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE.
                            </p>

                            <h2>10. Changes to Terms</h2>
                            <p>
                                We reserve the right to modify these Terms at any time. We will provide notice of significant changes 
                                by posting the updated Terms on our website. Your continued use of the Service after such modifications 
                                constitutes your acceptance of the modified Terms.
                            </p>

                            <h2>11. Governing Law</h2>
                            <p>
                                These Terms shall be governed by and construed in accordance with the laws of Canada, without regard 
                                to its conflict of law provisions.
                            </p>

                            <h2>12. Contact Us</h2>
                            <p>
                                If you have any questions about these Terms, please contact us at:
                                <br />
                                Email: legal@harmonix.ai
                                <br />
                                Address: Beirut, Lebanon
                            </p>

                            <p className="text-muted mt-4">Last Updated: May 18, 2025</p>
                        </div>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default Terms;
