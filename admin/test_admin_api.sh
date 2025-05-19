#!/bin/bash

# This script directly tests the admin API using curl to help diagnose access issues

# Set directory to the Harmonix project
cd $(dirname $0)

echo "🔍 Harmonix Admin API Test"
echo "================================="
echo ""

# Get token from local storage using a temporary HTML file
echo "1️⃣ Getting token from localStorage..."

cat > temp_get_token.html <<EOF
<!DOCTYPE html>
<html>
<head>
    <title>Get Token</title>
</head>
<body>
    <pre id="result"></pre>
    <script>
        function getLocalStorage() {
            const token = localStorage.getItem('token');
            const user = localStorage.getItem('user');
            
            document.getElementById('result').textContent = JSON.stringify({
                token: token,
                user: user ? JSON.parse(user) : null
            }, null, 2);
        }
        
        getLocalStorage();
    </script>
</body>
</html>
EOF

# Start a temporary server
npx http-server -p 8787 --silent &
HTTP_SERVER_PID=$!

# Wait for server to start
sleep 1

# Create a temp file to store the result
touch temp_token_result.json

# Open the HTML file, wait for the user to interact
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "http://localhost:8787/temp_get_token.html"
    echo "📱 Browser opened to extract token. Please copy the token displayed and paste it here:"
else
    echo "Please open http://localhost:8787/temp_get_token.html in your browser"
    echo "📱 Please copy the token displayed and paste it here:"
fi

# Get token input
echo "Enter token (or press Enter to extract from previous admin login):"
read USER_TOKEN

# If no token provided, try to get it from a file
if [ -z "$USER_TOKEN" ]; then
    if [ -f "admin_token.txt" ]; then
        USER_TOKEN=$(cat admin_token.txt)
        echo "📄 Using token from admin_token.txt"
    else
        # Try debug login
        echo "🔑 No token provided. Trying debug login..."
        DEBUG_LOGIN=$(curl -s -X POST http://localhost:5001/debug-login -H "Content-Type: application/json" -d '{"username": "admin"}')
        USER_TOKEN=$(echo $DEBUG_LOGIN | grep -o '"token":"[^"]*' | sed 's/"token":"//')
        
        if [ -n "$USER_TOKEN" ]; then
            echo "✅ Successfully obtained token via debug login"
            echo $USER_TOKEN > admin_token.txt
        else
            echo "❌ Failed to get token via debug login"
            USER_TOKEN=""
        fi
    fi
fi

# Kill the HTTP server
kill $HTTP_SERVER_PID 2>/dev/null
rm temp_get_token.html

if [ -z "$USER_TOKEN" ]; then
    echo "❌ No token available. Cannot proceed with API test."
    exit 1
fi

# Confirm which server to use
echo ""
echo "2️⃣ Server selection"
echo "Which server should we test against?"
echo "1) localhost:5001"
echo "2) localhost:5002"
echo "3) Custom"
read -p "Enter choice (default: 1): " SERVER_CHOICE

case $SERVER_CHOICE in
    2)
        SERVER_URL="http://localhost:5002"
        ;;
    3)
        read -p "Enter server URL: " CUSTOM_URL
        SERVER_URL=$CUSTOM_URL
        ;;
    *)
        SERVER_URL="http://localhost:5001"
        ;;
esac

echo ""
echo "3️⃣ Testing API endpoints"
echo "--------------------------------"

# Test the admin API endpoint
echo "🔸 Testing admin users endpoint with token..."
echo "curl -v -H \"Authorization: Bearer $USER_TOKEN\" $SERVER_URL/api/admin/users"
echo ""
ADMIN_RESPONSE=$(curl -v -H "Authorization: Bearer $USER_TOKEN" $SERVER_URL/api/admin/users 2>&1)
echo "Response:"
echo "$ADMIN_RESPONSE"

echo ""
echo "4️⃣ Testing token decoding"
echo "--------------------------------"

# Extract the token payload
TOKEN_PAYLOAD=$(echo $USER_TOKEN | cut -d. -f2)

# If we're on macOS we might have base64 tool
if [[ "$OSTYPE" == "darwin"* ]]; then
    # Add padding if needed
    PADDING=$((4 - ${#TOKEN_PAYLOAD} % 4))
    if [ "$PADDING" -eq 4 ]; then
        PADDING=0
    fi
    TOKEN_PAYLOAD_PADDED=$TOKEN_PAYLOAD
    for i in $(seq 1 $PADDING); do
        TOKEN_PAYLOAD_PADDED="${TOKEN_PAYLOAD_PADDED}="
    done
    
    echo "Decoded token payload:"
    echo $TOKEN_PAYLOAD_PADDED | base64 --decode 2>/dev/null || echo "Failed to decode token"
else
    echo "Unable to decode token payload (base64 tools required). Please check in browser."
fi

echo ""
echo "5️⃣ Summary"
echo "--------------------------------"
if echo "$ADMIN_RESPONSE" | grep -q '"id"'; then
    echo "✅ Admin API access successful!"
else
    echo "❌ Admin API access failed."
    
    if echo "$ADMIN_RESPONSE" | grep -q "403"; then
        echo "🔍 Possible cause: Token doesn't have admin privileges"
    elif echo "$ADMIN_RESPONSE" | grep -q "401"; then
        echo "🔍 Possible cause: Token invalid or expired"
    elif echo "$ADMIN_RESPONSE" | grep -q "Error:"; then
        echo "🔍 Possible cause: Connection error or server not running"
    fi
fi

echo ""
echo "Test completed."
