

document.addEventListener("DOMContentLoaded", () => {
    // Lock feature: Prompt for username and password
    const lockScreen = () => {
        const credentials = [
            { username: "mariz", password: "mariz2006" },
            { username: "lucifurge", password: "09100909" },
            { username: "sryunnie", password: "sryx.hyunie+2000" },
            // 36 blank entries for additional usernames and passwords
            ...Array(35).fill({ username: "", password: "" })
        ];

        // Function for handling password visibility toggle
        const handlePasswordToggle = (e) => {
            if (e.target && e.target.id === "toggleLockPassword") {
                const passwordField = document.getElementById("lockPassword");
                passwordField.type = e.target.checked ? "text" : "password";
            }
        };

        // Add event listener once
        document.removeEventListener("change", handlePasswordToggle);
        document.addEventListener("change", handlePasswordToggle);

        Swal.fire({
            title: "Login Required",
            html: `
                <div class="mb-3">
                    <label for="lockUsername" class="form-label">Username</label>
                    <input type="text" id="lockUsername" class="form-control" placeholder="Enter Username">
                </div>
                <div class="mb-3">
                    <label for="lockPassword" class="form-label">Password</label>
                    <input type="password" id="lockPassword" class="form-control" placeholder="Enter Password">
                    <div class="mt-2">
                        <input type="checkbox" id="toggleLockPassword" class="form-check-input">
                        <label for="toggleLockPassword" class="form-check-label">Show Password</label>
                    </div>
                </div>
            `,
            confirmButtonText: "Login",
            allowOutsideClick: false,
            preConfirm: () => {
                const username = document.getElementById("lockUsername").value.trim();
                const password = document.getElementById("lockPassword").value.trim();

                // Validate credentials
                const valid = credentials.some(
                    (cred) => cred.username === username && cred.password === password
                );

                if (!valid) {
                    Swal.showValidationMessage("Invalid username or password");
                    return false;  // Prevent proceeding if invalid
                }

                return true;  // Allow proceeding if valid
            },
        }).then((result) => {
            if (result.isConfirmed) {
                // Proceed after successful login
                console.log("Login successful!");
            } else {
                // If invalid credentials, keep the lock screen up
                lockScreen();
            }
        });
    };

    lockScreen();  // Call lockScreen function when the page loads

    // Function to generate email address
    function generateEmail() {
        Swal.fire({
            title: 'Generating Email...',
            text: 'Please wait while we generate your temporary email.',
            didOpen: () => Swal.showLoading()
        });

        axios.post('https://pyeulmail-serverapi-production.up.railway.app/generate_email')
            .then(response => {
                const { email, sid_token } = response.data;
                if (email && sid_token) {
                    document.getElementById('generatedEmail').value = email;
                    document.getElementById('emailInput').value = email;
                    localStorage.setItem('sid_token', sid_token);
                    startPolling(sid_token);
                    Swal.fire('Email Generated!', `Your email: ${email}`, 'success');
                } else {
                    Swal.fire('Error', 'Invalid response from server.', 'error');
                }
            })
            .catch(() => Swal.fire('Error', 'Error generating email. Please try again.', 'error'));
    }

    // Function to fetch messages
    function fetchMessages(sidToken, seq = 0) {
        axios.post('https://pyeulmail-serverapi-production.up.railway.app/check_messages', { sid_token: sidToken, seq })
            .then(response => {
                const mailList = response.data.messages;
                if (mailList.length > 0) {
                    displayMessages(mailList, seq);
                } else {
                    console.log("[!] No new messages yet. Checking again in 15 seconds...");
                }
            })
            .catch(() => Swal.fire('Error', 'Error fetching messages. Please try again.', 'error'));
    }

    // Function to display messages
    function displayMessages(messages, seq) {
        const inboxContainer = document.getElementById('emailContent');
        inboxContainer.innerHTML = messages.length === 0 ? '<p>No messages available.</p>' : '';

        messages.forEach(message => {
            const emailItem = document.createElement('div');
            emailItem.classList.add('email-item');
            const sender = message.mail_from || 'Unknown';
            const displaySender = sender.includes('@') ? sender.split('@')[0] : sender;

            emailItem.innerHTML = `
                <strong>From:</strong> ${displaySender}
                <br><strong>Subject:</strong> ${message.mail_subject || 'No Subject'}
                <br><button onclick="viewEmailContent('${message.mail_id}')">View</button>
            `;
            inboxContainer.appendChild(emailItem);
        });

        localStorage.setItem('lastSeq', seq);
        console.log("Updated seq:", seq);
    }

    // Function to view full email content
    window.viewEmailContent = function(mailId) {
        const sidToken = localStorage.getItem('sid_token');
        Swal.fire({
            title: 'Fetching Email Content...',
            text: 'Please wait while we retrieve the email content.',
            didOpen: () => Swal.showLoading()
        });

        axios.get('https://pyeulmail-serverapi-production.up.railway.app/fetch_email', {
            params: { mail_id: mailId, sid_token: sidToken }
        })
        .then(response => Swal.fire({ title: 'Email Content', text: response.data, icon: 'info' }))
        .catch(() => Swal.fire('Error', 'Error fetching email content. Please try again.', 'error'));
    }

    // Function to start polling messages
    function startPolling(sidToken) {
        if (localStorage.getItem('pollingInterval')) {
            clearInterval(localStorage.getItem('pollingInterval'));
        }
        fetchMessages(sidToken);
        const intervalId = setInterval(() => fetchMessages(sidToken), 15000);
        localStorage.setItem('pollingInterval', intervalId);
    }

    // Initialize event listeners
    document.getElementById('generateEmailBtn').addEventListener('click', generateEmail);
    document.getElementById('checkBtn').addEventListener('click', () => {
        const sidToken = localStorage.getItem('sid_token');
        sidToken ? fetchMessages(sidToken) : Swal.fire('Error', 'No SID token found. Please generate an email first.', 'error');
    });

    // ** New Feature: Background image change functionality **
    document.getElementById("bgUploader").addEventListener("change", function (e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith("image/")) {  // Ensure it's an image
            const reader = new FileReader();
            reader.onload = function () {
                document.body.style.backgroundImage = `url(${reader.result})`;
            };
            reader.readAsDataURL(file);
        } else {
            Swal.fire('Error', 'Please upload a valid image file.', 'error');
        }
    });

    // ** New Feature: Change background color of inbox message when hovered **
    const inboxContainer = document.getElementById('emailContent');
    inboxContainer.addEventListener('mouseover', function (e) {
        if (e.target && e.target.classList.contains('email-item')) {
            e.target.style.backgroundColor = '#f0f0f0';  // Highlight the email item
        }
    });

    inboxContainer.addEventListener('mouseout', function (e) {
        if (e.target && e.target.classList.contains('email-item')) {
            e.target.style.backgroundColor = '';  // Remove highlight
        }
    });

}); // End of DOMContentLoaded
