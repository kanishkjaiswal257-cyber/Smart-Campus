const API_URL = "http://localhost:5000/api/users";

export async function getUsers(token) {
    const response = await fetch(API_URL, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });


    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch users.");
    }

    return result.users || [];

}

export async function updateUserStatus(userId, action, token) {
    const response = await fetch(`${API_URL}/${userId}/${action}`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update user status.");
    }

    return result;


}
