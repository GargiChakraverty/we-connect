//array for storing the users
let users = [];
//array for storing the unique roomIds
let rooms = [];

//called when a new user enters a room
function enterUser(userID, username, roomID, socketID) {
	let user = { userID, username, roomID, socketID };
	//user added to the users array
	users.push(user);
	//if the roomId they are entering is not in rooms array add it.
	if (getAllRoomUsers(roomID).length == 1) {
		rooms.push(roomID);
	}
	return user;
}

//returns all the users in a specific room.
function userLeave(id) {
	let index = users.find((user) => user.socketId === id);
	if (index !== -1) {
		return users.splice(index, 1)[0];
	}
}

//returns all the users in a specific room.
function getAllRoomUsers(roomID) {
	//console.log(users);
	return users.filter((user) => user.roomID === roomID);
}

function getCurrentUser(socketID) {
	return users.find((user) => user.socketID === socketID);
}


module.exports = {
	enterUser,
	getAllRoomUsers,
	getCurrentUser,
	userLeave
};