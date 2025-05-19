import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const PrivacyPolicy = () => {
    return (
        <Container className="py-5">
            <Row className="justify-content-center">
                <Col md={10}>
                    <h1 className="mb-4">Privacy Policy</h1>
                    <div className="card">
                        <div className="card-body">
                            <h2>1. Introduction</h2>
                            <p>
                                At Harmonix, we respect your privacy and are committed to protecting your personal data.
                                This Privacy Policy will inform you as to how we look after your personal data when you visit our website
                                and tell you about your privacy rights and how the law protects you.
                            </p>

                            <h2>2. The Data We Collect About You</h2>
                            <p>
                                Personal data, or personal information, means any information about an individual from which that person
                                can be identified. We may collect, use, store, and transfer different kinds of personal data about you which
                                we have grouped together as follows:
                            </p>
                            <ul>
                                <li><strong>Identity Data</strong>: includes first name, last name, username or similar identifier</li>
                                <li><strong>Contact Data</strong>: includes email address and telephone numbers</li>
                                <li><strong>Technical Data</strong>: includes internet protocol (IP) address, your login data, browser type and version</li>
                                <li><strong>Usage Data</strong>: includes information about how you use our website and services</li>
                                <li><strong>Audio Data</strong>: includes audio files that you upload for analysis</li>
                            </ul>

                            <h2>3. How We Use Your Personal Data</h2>
                            <p>
                                We will only use your personal data when the law allows us to. Most commonly, we will use your personal data
                                in the following circumstances:
                            </p>
                            <ul>
                                <li>To register you as a new customer</li>
                                <li>To process and deliver your service requests</li>
                                <li>To manage our relationship with you</li>
                                <li>To improve our website, products/services, marketing or customer relationships</li>
                            </ul>

                            <h2>4. Data Security</h2>
                            <p>
                                We have put in place appropriate security measures to prevent your personal data from being
                                accidentally lost, used or accessed in an unauthorized way, altered or disclosed.
                            </p>

                            <h2>5. Data Retention</h2>
                            <p>
                                We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for,
                                including for the purposes of satisfying any legal, accounting, or reporting requirements.
                            </p>

                            <h2>6. Your Legal Rights</h2>
                            <p>
                                Under certain circumstances, you have rights under data protection laws in relation to your personal data,
                                including the right to:
                            </p>
                            <ul>
                                <li>Request access to your personal data</li>
                                <li>Request correction of your personal data</li>
                                <li>Request erasure of your personal data</li>
                                <li>Object to processing of your personal data</li>
                                <li>Request restriction of processing your personal data</li>
                                <li>Request transfer of your personal data</li>
                                <li>Right to withdraw consent</li>
                            </ul>

                            <h2>7. Changes to This Privacy Policy</h2>
                            <p>
                                We may update our Privacy Policy from time to time. We will notify you of any changes by posting
                                the new Privacy Policy on this page and updating the "Last Updated" date.
                            </p>

                            <h2>8. Contact Us</h2>
                            <p>
                                If you have any questions about this Privacy Policy, please contact us at:
                                <br />
                                Email: privacy@harmonix.ai
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

export default PrivacyPolicy;
