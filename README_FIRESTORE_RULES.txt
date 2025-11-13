rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    match /products/{productId} {
      allow read: if true;
      allow create: if request.auth != null && request.resource.data.owner == request.auth.uid && request.resource.data.ownerRole == 'farmer';
      allow update, delete: if request.auth != null && resource.data.owner == request.auth.uid;
    }

    match /chats/{chatId} {
      allow read, write: if request.auth != null && (request.auth.uid in resource.data.participants || request.auth.uid in request.resource.data.participants);
      allow create: if request.auth != null && request.resource.data.participants is list && request.auth.uid in request.resource.data.participants;
    }

    match /orders/{orderId} {
      allow create: if request.auth != null && request.resource.data.buyerId == request.auth.uid;
      allow read: if request.auth != null && (request.auth.uid == resource.data.buyerId || request.auth.uid in resource.data.participants);
      allow update, delete: if false;
    }
  }
}
