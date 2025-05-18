import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const Cookies = () => {
    return (
        <Container className="py-5">
            <Row className="justify-content-center">
                <Col md={10}>
                    <h1 className="mb-4">Cookies Policy</h1>
                    <div className="card">
                        <div className="card-body">
                            <h2>1. Introduction</h2>
                            <p>
                                This Cookies Policy explains how Harmonix ("we", "us", "our") uses cookies and similar technologies 
                                on our website. By using our website, you consent to the use of cookies as described in this policy.
                            </p>

                            <h2>2. What Are Cookies?</h2>
                            <p>
                                Cookies are small text files that are placed on your computer or mobile device when you visit a website. 
                                They are widely used to make websites work more efficiently and provide information to the website owners.
                            </p>

                            <h2>3. How We Use Cookies</h2>
                            <p>
                                We use cookies for the following purposes:
                            </p>
                            <ul>
                                <li><strong>Essential Cookies:</strong> These cookies are necessary for the website to function properly 
                                and cannot be switched off. They are usually set in response to actions made by you such as logging in 
                                or filling in forms.</li>
                                <li><strong>Performance Cookies:</strong> These cookies allow us to count visits and traffic sources so 
                                we can measure and improve the performance of our site.</li>
                                <li><strong>Functional Cookies:</strong> These cookies enable the website to provide enhanced functionality 
                                and personalization, such as remembering your preferences.</li>
                                <li><strong>Targeting Cookies:</strong> These cookies may be set through our site by our advertising partners. 
                                They may be used to build a profile of your interests and show you relevant adverts on other sites.</li>
                            </ul>

                            <h2>4. Types of Cookies We Use</h2>
                            <ul>
                                <li><strong>Session Cookies:</strong> These cookies are temporary and are deleted when you close your browser.</li>
                                <li><strong>Persistent Cookies:</strong> These cookies remain on your device for a set period or until you delete them.</li>
                                <li><strong>First-Party Cookies:</strong> These cookies are set by our website.</li>
                                <li><strong>Third-Party Cookies:</strong> These cookies are set by third parties, such as analytics services.</li>
                            </ul>

                            <h2>5. Specific Cookies We Use</h2>
                            <p>
                                The following list details the cookies used in our website:
                            </p>
                            <table className="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Cookie Name</th>
                                        <th>Purpose</th>
                                        <th>Duration</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>auth_token</td>
                                        <td>Authentication token to keep users logged in</td>
                                        <td>30 days</td>
                                    </tr>
                                    <tr>
                                        <td>_ga</td>
                                        <td>Google Analytics - Used to distinguish users</td>
                                        <td>2 years</td>
                                    </tr>
                                    <tr>
                                        <td>_gid</td>
                                        <td>Google Analytics - Used to distinguish users</td>
                                        <td>24 hours</td>
                                    </tr>
                                    <tr>
                                        <td>_user_preferences</td>
                                        <td>Stores user preferences for website functionality</td>
                                        <td>1 year</td>
                                    </tr>
                                </tbody>
                            </table>

                            <h2>6. Managing Cookies</h2>
                            <p>
                                You can control and manage cookies in various ways. Most web browsers allow you to manage your cookie 
                                preferences. You can:
                            </p>
                            <ul>
                                <li>Delete cookies from your device</li>
                                <li>Block cookies by activating the setting on your browser that allows you to refuse all or some cookies</li>
                                <li>Set your browser to notify you when you receive a cookie</li>
                            </ul>
                            <p>
                                Please note that if you choose to block or delete cookies, this may impact your experience of our website, 
                                as certain features may not function properly.
                            </p>

                            <h2>7. Changes to This Policy</h2>
                            <p>
                                We may update our Cookies Policy from time to time. We will notify you of any changes by posting 
                                the new Cookies Policy on this page.
                            </p>

                            <h2>8. Contact Us</h2>
                            <p>
                                If you have any questions about our use of cookies, please contact us at:
                                <br />
                                Email: privacy@harmonix.ai
                                <br />
                                Address: Montreal, Canada
                            </p>

                            <p className="text-muted mt-4">Last Updated: May 18, 2025</p>
                        </div>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default Cookies;
