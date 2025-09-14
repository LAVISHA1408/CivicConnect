// MongoDB initialization script
db = db.getSiblingDB('civicconnect');

// Create collections
db.createCollection('users');
db.createCollection('reports');
db.createCollection('messages');
db.createCollection('contacts');
db.createCollection('analytics');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "createdAt": -1 });

db.reports.createIndex({ "location": "2dsphere" });
db.reports.createIndex({ "status": 1 });
db.reports.createIndex({ "category": 1 });
db.reports.createIndex({ "priority": 1 });
db.reports.createIndex({ "reporter": 1 });
db.reports.createIndex({ "createdAt": -1 });
db.reports.createIndex({ "votes.count": -1 });

db.messages.createIndex({ "sender": 1, "createdAt": -1 });
db.messages.createIndex({ "recipient": 1, "isRead": 1, "createdAt": -1 });
db.messages.createIndex({ "relatedReport": 1 });

db.contacts.createIndex({ "status": 1, "createdAt": -1 });
db.contacts.createIndex({ "category": 1 });
db.contacts.createIndex({ "isRead": 1 });

db.analytics.createIndex({ "date": 1, "period": 1 });

print('MongoDB initialization completed successfully!');
