import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
const port = process.env.PORT || 3000;
const app = express();

// CORS for other API routes (optional)
import cors from 'cors'
app.use(cors({
   origin: "https://video-chat-frontend-dhaval.vercel.app",
   methods: ["GET", "POST"],
   credentials: true
}));

// Create HTTP server
const httpServer = createServer(app);

// Socket.IO with CORS setup
const io = new Server(httpServer, {
   cors: {
      origin: "https://video-chat-frontend-dhaval.vercel.app", // No trailing slash
      methods: ["GET", "POST"],
      credentials: true
   }
});

const users = new Map();

io.on("connection", (socket) => {
   console.log("A user connected:", socket.id);

   socket.on("join-room", (data) => {
      const { roomId, userId } = data;
      users.set(userId, socket.id);
      socket.join(roomId);
      socket.emit ("joined-room", { userId });
      socket.to(roomId).emit("user-joined", { userId });
      console.log("Users Map:", users);
   });

   socket.on("call-user", (data) => {
      const { userId, offer } = data;
      const fromUserId = [...users].find(([key, val]) => val === socket.id)?.[0];
      const toSocketId = users.get(userId);
      if (toSocketId) {
         setTimeout(() => {
            io.to(toSocketId).emit("incoming-call", { from: fromUserId, offer });
            console.log('call sucess : ' , toSocketId)      
         }, 1000);
      } else {
         console.log(`User with ID ${userId} not found.`);
      }
   });
   socket.on("send-answer", (data) => {
      const { userId, answer } = data;
      const fromUserId = [...users].find(([key, val]) => val === socket.id)[0];
      const toSocketId = users.get(userId);
      if (toSocketId) {
         console.log(`User with ID ${userId} found.`);
         io.to(toSocketId).emit("answer-from-user", { from: fromUserId, answer });
      } else {
         console.log(`User with ID ${userId} not found.`);
      }
   });
   socket.on("disconnect", () => {
      const disconnectedUserId = [...users].find(([key, val]) => val === socket.id)?.[0];
      if (disconnectedUserId) {
         io.emit("user-disconnect",{userId:disconnectedUserId})
         users.delete(disconnectedUserId);
         console.log(`User disconnected: ${disconnectedUserId}`);
      }
   });
});

app.get("/", (req, res) => {
   res.send("Hello World!");
});

httpServer.listen(port, () => {
   console.log("Server is running on port 3000");
});
