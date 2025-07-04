import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

async function addingToListInKlaviyo(profileId, listId) {
    try {
        const myHeaders = new Headers();
        myHeaders.append("Authorization", "Klaviyo-API-Key pk_818253c13293f76a45ef14ba2d3286a4ec");
        myHeaders.append("Accept", "application/vnd.api+json");
        myHeaders.append("Content-Type", "application/vnd.api+json");
        myHeaders.append("revision", "2024-10-15");

        const raw = JSON.stringify({
            "data": [
                {
                    "type": "profile",
                    "id": profileId,
                }
            ]
        });

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };

        const response = await fetch(`https://a.klaviyo.com/api/lists/${listId}/relationships/profiles`, requestOptions);
        const text = await response.text(); // Read raw response text

        if (!response.ok) {
            if (response.status === 409) {
                console.log(`Profile already exists in the list.`);
                return { message: 'Profile already in the list', success: true };
            }
            throw new Error(`Failed to add to list: ${text}`);
        }

        console.log(`Profile added to the list successfully.`);
        return { message: 'Email subscribed successfully', success: true };
    } catch (error) {
        console.error(`Error in addingToListInKlaviyo: ${error.message}`);
        return { message: error.message, success: false };
    }
}

async function updateProfileInKlaviyo(profileId, phone) {
    try {
        const myHeaders = new Headers();
        myHeaders.append("Authorization", "Klaviyo-API-Key pk_818253c13293f76a45ef14ba2d3286a4ec");
        myHeaders.append("Accept", "application/vnd.api+json");
        myHeaders.append("Content-Type", "application/vnd.api+json");
        myHeaders.append("revision", "2024-10-15");

        const raw = JSON.stringify({
            "data": {
                "type": "profile",
                "id": profileId,
                "attributes": {
                    ...(phone && { "phone_number": phone }) // Update phone_number only if provided
                }
            }
        });

        const requestOptions = {
            method: "PATCH",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };

        const response = await fetch(`https://a.klaviyo.com/api/profiles/${profileId}`, requestOptions);
        const text = await response.text();

        if (!response.ok) {
            throw new Error(`Failed to update profile: ${text}`);
        }

        console.log(`Profile updated successfully.`);
    } catch (error) {
        console.error(`Error in updateProfileInKlaviyo: ${error.message}`);
        throw error;
    }
}

async function cvkd_klaviyo(req, res) {
    const { email, phone, id: listId, baseId: baseId } = req.body;

    try {
        const myHeaders = new Headers();
        myHeaders.append("Authorization", "Klaviyo-API-Key pk_818253c13293f76a45ef14ba2d3286a4ec");
        myHeaders.append("Accept", "application/vnd.api+json");
        myHeaders.append("Content-Type", "application/vnd.api+json");
        myHeaders.append("revision", "2024-10-15");

        const raw = JSON.stringify({
            "data": {
                "type": "profile",
                "attributes": {
                    "email": email,
                    ...(phone && { "phone_number": phone }) // Include phone only if provided
                }
            }
        });

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };

        const response = await fetch("https://a.klaviyo.com/api/profiles", requestOptions);
        const text = await response.text();

        if (!response.ok) {
            if (response.status === 409) {
                console.log("Profile already exists:", text);
                const existingProfileId = JSON.parse(text)?.errors?.[0]?.meta?.duplicate_profile_id;

                if (existingProfileId) {
                    let baseListResponse, listResponse; // Declare variables to store the responses
                    if (phone) {
                        await updateProfileInKlaviyo(existingProfileId, phone);
                    }
                    if (baseId) {
                        const baseListResponse = await addingToListInKlaviyo(existingProfileId, baseId);
                    }
                    if (listId) {
                        const listResponse = await addingToListInKlaviyo(existingProfileId, listId);
                    }

                    return res.status(200).json({ 
                        baseList: baseListResponse, 
                        list: listResponse 
                    });
                }
                throw new Error(`Failed to retrieve existing profile ID.`);
            }
            throw new Error(`Failed to create profile: ${text}`);
        }

        const result = JSON.parse(text); // Safely parse the response
        let baseListResponse, listResponse; // Declare variables to store the responses
        if (baseId) {
            const baseListResponse = await addingToListInKlaviyo(result.data.id, baseId);
        }
        if (listId) {
            const listResponse = await addingToListInKlaviyo(result.data.id, listId);
        }

        return res.status(200).json({ 
            baseList: baseListResponse, 
            list: listResponse 
        });
    } catch (error) {
        console.error(`Error in cvkd_klaviyo: ${error.message}`);
        return res.status(400).json({ message: error.message });
    }
}

export default cvkd_klaviyo;