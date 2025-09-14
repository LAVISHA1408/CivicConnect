const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Report = require('../models/Report');
const Message = require('../models/Message');
const Contact = require('../models/Contact');
const Analytics = require('../models/Analytics');

// Generate unique report ID
const generateReportId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `RPT-${timestamp}-${random}`.toUpperCase();
};

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/civicconnect');
    console.log('MongoDB connected for seeding...');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Sample data
const sampleUsers = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'citizen',
    reportsCount: 3
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'password123',
    role: 'citizen',
    reportsCount: 2
  },
  {
    name: 'Mike Johnson',
    email: 'mike@example.com',
    password: 'password123',
    role: 'citizen',
    reportsCount: 1
  },
  {
    name: 'Sarah Wilson',
    email: 'sarah@example.com',
    password: 'password123',
    role: 'citizen',
    reportsCount: 4
  },
  {
    name: 'Admin User',
    email: 'admin@civicconnect.com',
    password: 'admin123',
    role: 'admin',
    reportsCount: 0
  },
  {
    name: 'City Manager',
    email: 'manager@civicconnect.com',
    password: 'manager123',
    role: 'admin',
    reportsCount: 0
  }
];

const sampleReports = [
  {
    title: 'Large pothole on Main Street',
    description: 'There is a large pothole on Main Street near Central Avenue that is causing traffic issues and potential damage to vehicles.',
    category: 'pothole',
    priority: 'high',
    location: {
      type: 'Point',
      coordinates: [-74.0059, 40.7128],
      address: 'Main Street, New York, NY'
    },
    department: 'Public Works',
    status: 'in_progress',
    votes: { count: 15, voters: [] },
    tags: ['traffic', 'safety', 'road-damage']
  },
  {
    title: 'Streetlight out on Oak Street',
    description: 'Streetlight is not working on Oak Street, making the area unsafe at night for pedestrians and drivers.',
    category: 'streetlight',
    priority: 'medium',
    location: {
      type: 'Point',
      coordinates: [-74.0060, 40.7129],
      address: 'Oak Street, New York, NY'
    },
    department: 'Public Works',
    status: 'pending',
    votes: { count: 8, voters: [] },
    tags: ['safety', 'lighting', 'night']
  },
  {
    title: 'Overflowing trash bins at City Park',
    description: 'Trash bins at City Park are overflowing and attracting pests. Need immediate attention.',
    category: 'trash',
    priority: 'medium',
    location: {
      type: 'Point',
      coordinates: [-74.0058, 40.7127],
      address: 'City Park, New York, NY'
    },
    department: 'Sanitation',
    status: 'acknowledged',
    votes: { count: 12, voters: [] },
    tags: ['sanitation', 'pests', 'park']
  },
  {
    title: 'Graffiti on historical building',
    description: 'Graffiti has been painted on the historical building downtown. Needs to be removed to maintain the building\'s appearance.',
    category: 'graffiti',
    priority: 'low',
    location: {
      type: 'Point',
      coordinates: [-74.0061, 40.7130],
      address: 'Downtown Historical District, New York, NY'
    },
    department: 'Parks & Recreation',
    status: 'resolved',
    votes: { count: 5, voters: [] },
    tags: ['graffiti', 'historical', 'cleanup']
  },
  {
    title: 'Broken bench in Riverside Park',
    description: 'One of the benches in Riverside Park is broken and needs repair. The backrest is completely detached.',
    category: 'other',
    priority: 'low',
    location: {
      type: 'Point',
      coordinates: [-74.0057, 40.7126],
      address: 'Riverside Park, New York, NY'
    },
    department: 'Parks & Recreation',
    status: 'pending',
    votes: { count: 3, voters: [] },
    tags: ['bench', 'repair', 'park']
  },
  {
    title: 'Damaged playground equipment',
    description: 'The swing set in the children\'s playground has a broken chain and needs immediate repair for safety.',
    category: 'other',
    priority: 'high',
    location: {
      type: 'Point',
      coordinates: [-74.0056, 40.7125],
      address: 'Children\'s Playground, New York, NY'
    },
    department: 'Parks & Recreation',
    status: 'in_progress',
    votes: { count: 20, voters: [] },
    tags: ['playground', 'safety', 'children']
  }
];

const sampleMessages = [
  {
    subject: 'Update on pothole repair',
    content: 'Hello, any update on when the pothole on Main Street will be repaired? It\'s getting worse with the recent rain.',
    messageType: 'report_update',
    priority: 'normal'
  },
  {
    subject: 'Thank you for fixing the streetlight',
    content: 'Just wanted to say thank you for fixing the streetlight on Oak Street so quickly. The neighborhood feels much safer now.',
    messageType: 'general',
    priority: 'normal'
  },
  {
    subject: 'New issue in Riverside Park',
    content: 'There\'s a broken bench and some damaged playground equipment in Riverside Park that needs attention.',
    messageType: 'general',
    priority: 'high'
  }
];

const sampleContacts = [
  {
    name: 'Robert Chen',
    email: 'robert@example.com',
    subject: 'General inquiry about CivicConnect',
    message: 'I would like to know more about how CivicConnect works and how I can get involved in my community.',
    category: 'general',
    status: 'new'
  },
  {
    name: 'Lisa Martinez',
    email: 'lisa@example.com',
    subject: 'Bug report - Image upload not working',
    message: 'I tried to upload an image with my report but it keeps failing. The error message says "file too large" but my image is only 2MB.',
    category: 'bug_report',
    status: 'in_progress'
  },
  {
    name: 'David Kim',
    email: 'david@example.com',
    subject: 'Feature request - Mobile app',
    message: 'Would it be possible to create a mobile app for CivicConnect? It would make it much easier to report issues on the go.',
    category: 'feature_request',
    status: 'responded'
  }
];

// Seed function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Report.deleteMany({});
    await Message.deleteMany({});
    await Contact.deleteMany({});
    await Analytics.deleteMany({});

    console.log('🗑️ Cleared existing data');

    // Create users
    const users = [];
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      users.push(user);
    }
    console.log(`👥 Created ${users.length} users`);

    // Create reports
    const reports = [];
    for (let i = 0; i < sampleReports.length; i++) {
      const reportData = sampleReports[i];
      const reporter = users[i % 4]; // Assign to first 4 users (citizens)
      
      const report = new Report({
        ...reportData,
        reportId: generateReportId(),
        reporter: reporter._id,
        assignedTo: i < 2 ? users[4]._id : null // Assign first 2 reports to admin
      });
      
      await report.save();
      reports.push(report);
    }
    console.log(`📋 Created ${reports.length} reports`);

    // Create messages
    const messages = [];
    for (let i = 0; i < sampleMessages.length; i++) {
      const messageData = sampleMessages[i];
      const sender = users[i % 4]; // Assign to first 4 users (citizens)
      const recipient = users[4]; // Admin user
      
      const message = new Message({
        ...messageData,
        sender: sender._id,
        recipient: recipient._id,
        relatedReport: i < reports.length ? reports[i]._id : null
      });
      
      await message.save();
      messages.push(message);
    }
    console.log(`💬 Created ${messages.length} messages`);

    // Create contacts
    const contacts = [];
    for (const contactData of sampleContacts) {
      const contact = new Contact({
        ...contactData,
        assignedTo: contactData.status === 'in_progress' ? users[4]._id : null
      });
      await contact.save();
      contacts.push(contact);
    }
    console.log(`📞 Created ${contacts.length} contacts`);

    // Generate analytics
    await Analytics.calculateDailyAnalytics();
    console.log('📊 Generated analytics data');

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📝 Sample Login Credentials:');
    console.log('Citizen: john@example.com / password123');
    console.log('Citizen: jane@example.com / password123');
    console.log('Admin: admin@civicconnect.com / admin123');
    console.log('Admin: manager@civicconnect.com / manager123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run seeding
if (require.main === module) {
  connectDB().then(() => {
    seedDatabase();
  });
}

module.exports = { seedDatabase };
