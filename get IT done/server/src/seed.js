const mongoose = require('mongoose');
const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Category } = require('./models/Category');
const { Project } = require('./models/Project');
const { Goal } = require('./models/Goal');
const { Tag } = require('./models/Tag');
const { Task } = require('./models/Task');

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/get-it-done';

// ─── Helper: random date between two dates ───────────────────────────────────
function randomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function pickN(arr, n) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

// ─── Seed data ────────────────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 Connecting to', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);

  // Clear existing data
  await Promise.all([
    Category.deleteMany({}),
    Project.deleteMany({}),
    Goal.deleteMany({}),
    Tag.deleteMany({}),
    Task.deleteMany({})
  ]);
  console.log('🗑️  Cleared existing data');

  // ── Categories ──────────────────────────────────────────────────────────────
  const categoryData = [
    { name: 'Work', color: '#3b82f6' },         // blue
    { name: 'Personal', color: '#10b981' },      // green
    { name: 'Health & Fitness', color: '#ef4444' }, // red
    { name: 'Finance', color: '#f59e0b' },       // amber
    { name: 'Learning', color: '#8b5cf6' },      // purple
    { name: 'Home', color: '#ec4899' },          // pink
    { name: 'Social', color: '#06b6d4' }         // cyan
  ];
  const categories = await Category.insertMany(categoryData);
  console.log(`✅ Created ${categories.length} categories`);

  // ── Projects ────────────────────────────────────────────────────────────────
  const projectData = [
    { name: 'Website Redesign', description: 'Complete overhaul of the company website with modern UI/UX' },
    { name: 'Mobile App MVP', description: 'Build the first version of the mobile app for iOS and Android' },
    { name: 'Q1 Marketing Campaign', description: 'Plan and execute marketing strategy for Q1 2026' },
    { name: 'Home Renovation', description: 'Kitchen and bathroom renovation project' },
    { name: 'Learn TypeScript', description: 'Complete TypeScript course and build practice projects' },
    { name: 'Budget Tracker', description: 'Personal finance tracking side project' },
    { name: 'Fitness Challenge', description: '90-day fitness transformation challenge' },
    { name: 'Book Club', description: 'Organize and participate in monthly book club meetings' }
  ];
  const projects = await Project.insertMany(projectData);
  console.log(`✅ Created ${projects.length} projects`);

  // ── Goals ───────────────────────────────────────────────────────────────────
  const goalData = [
    { title: 'Get promoted to Senior Developer', description: 'Demonstrate leadership, deliver key projects, and pass review', targetDate: new Date('2026-06-30') },
    { title: 'Run a half marathon', description: 'Train consistently and complete a 21K race', targetDate: new Date('2026-05-15') },
    { title: 'Save $10,000 emergency fund', description: 'Build a solid emergency fund by saving monthly', targetDate: new Date('2026-12-31') },
    { title: 'Read 24 books this year', description: 'Read 2 books per month across different genres', targetDate: new Date('2026-12-31') },
    { title: 'Launch side project', description: 'Build and ship the Budget Tracker app to production', targetDate: new Date('2026-04-01') },
    { title: 'Learn conversational Spanish', description: 'Complete B1 level Spanish through daily practice', targetDate: new Date('2026-09-01') },
    { title: 'Improve work-life balance', description: 'Set boundaries, take breaks, and spend more quality time with family', targetDate: new Date('2026-03-31') }
  ];
  const goals = await Goal.insertMany(goalData);
  console.log(`✅ Created ${goals.length} goals`);

  // ── Tags ────────────────────────────────────────────────────────────────────
  const tagData = [
    { name: 'urgent' },
    { name: 'quick-win' },
    { name: 'blocked' },
    { name: 'follow-up' },
    { name: 'deep-work' },
    { name: 'meeting' },
    { name: 'review' },
    { name: 'creative' },
    { name: 'admin' },
    { name: 'research' },
    { name: 'automation' },
    { name: 'documentation' }
  ];
  const tags = await Tag.insertMany(tagData);
  console.log(`✅ Created ${tags.length} tags`);

  // ── Helper look-ups ─────────────────────────────────────────────────────────
  const cat = (name) => categories.find((c) => c.name === name)._id;
  const proj = (name) => projects.find((p) => p.name === name)._id;
  const goal = (title) => goals.find((g) => g.title.startsWith(title))._id;
  const tag = (name) => tags.find((t) => t.name === name)._id;

  const now = new Date();
  const daysFromNow = (d) => {
    const date = new Date(now);
    date.setDate(date.getDate() + d);
    return date;
  };
  const daysAgo = (d) => daysFromNow(-d);

  // ── Tasks ───────────────────────────────────────────────────────────────────
  const taskData = [
    // ── Work / Website Redesign ───────────────────────────────────────────────
    {
      title: 'Design new homepage wireframe',
      description: 'Create low-fidelity wireframes for the new homepage layout using Figma',
      dueDate: daysFromNow(3),
      priority: 1,
      status: 'in_progress',
      projectId: proj('Website Redesign'),
      categoryId: cat('Work'),
      goalId: goal('Get promoted'),
      tags: [tag('deep-work'), tag('creative')]
    },
    {
      title: 'Set up CI/CD pipeline for staging',
      description: 'Configure GitHub Actions to auto-deploy to staging environment on PR merge',
      dueDate: daysFromNow(5),
      priority: 1,
      status: 'todo',
      projectId: proj('Website Redesign'),
      categoryId: cat('Work'),
      goalId: goal('Get promoted'),
      tags: [tag('automation'), tag('deep-work')]
    },
    {
      title: 'Review PR #142 — auth refactor',
      description: 'Code review for the authentication module refactor by Alex',
      dueDate: daysFromNow(1),
      priority: 2,
      status: 'todo',
      projectId: proj('Website Redesign'),
      categoryId: cat('Work'),
      tags: [tag('review'), tag('urgent')]
    },
    {
      title: 'Write API documentation for /users endpoint',
      description: 'Document all request/response schemas, error codes, and examples',
      dueDate: daysFromNow(7),
      priority: 3,
      status: 'todo',
      projectId: proj('Website Redesign'),
      categoryId: cat('Work'),
      tags: [tag('documentation')]
    },
    {
      title: 'Fix responsive layout on product page',
      description: 'The product cards break on screens smaller than 768px',
      dueDate: daysFromNow(2),
      priority: 1,
      status: 'in_progress',
      projectId: proj('Website Redesign'),
      categoryId: cat('Work'),
      tags: [tag('urgent')]
    },
    {
      title: 'Migrate database to new cluster',
      description: 'Move MongoDB Atlas cluster from M10 to M30 for better performance',
      dueDate: daysFromNow(14),
      priority: 2,
      status: 'todo',
      projectId: proj('Website Redesign'),
      categoryId: cat('Work'),
      tags: [tag('deep-work'), tag('blocked')]
    },

    // ── Work / Mobile App MVP ─────────────────────────────────────────────────
    {
      title: 'Create React Native project scaffold',
      description: 'Initialize the project with Expo, configure navigation and state management',
      dueDate: daysFromNow(4),
      priority: 1,
      status: 'done',
      projectId: proj('Mobile App MVP'),
      categoryId: cat('Work'),
      goalId: goal('Get promoted'),
      tags: [tag('deep-work')]
    },
    {
      title: 'Implement push notification service',
      description: 'Set up Firebase Cloud Messaging for both iOS and Android',
      dueDate: daysFromNow(10),
      priority: 2,
      status: 'todo',
      projectId: proj('Mobile App MVP'),
      categoryId: cat('Work'),
      tags: [tag('deep-work'), tag('research')]
    },
    {
      title: 'Design app icon and splash screen',
      description: 'Create branding assets for the app store listings',
      dueDate: daysFromNow(8),
      priority: 3,
      status: 'todo',
      projectId: proj('Mobile App MVP'),
      categoryId: cat('Work'),
      tags: [tag('creative')]
    },
    {
      title: 'User testing session — round 1',
      description: 'Conduct usability tests with 5 internal users and collect feedback',
      dueDate: daysFromNow(21),
      priority: 2,
      status: 'todo',
      projectId: proj('Mobile App MVP'),
      categoryId: cat('Work'),
      tags: [tag('meeting'), tag('follow-up')]
    },

    // ── Work / Q1 Marketing ───────────────────────────────────────────────────
    {
      title: 'Draft Q1 marketing plan',
      description: 'Outline target audience, channels, budget, and KPIs for Q1',
      dueDate: daysAgo(2),
      priority: 1,
      status: 'done',
      projectId: proj('Q1 Marketing Campaign'),
      categoryId: cat('Work'),
      tags: [tag('documentation'), tag('creative')]
    },
    {
      title: 'Create social media content calendar',
      description: 'Plan posts for LinkedIn, Twitter, and Instagram for January and February',
      dueDate: daysFromNow(3),
      priority: 2,
      status: 'in_progress',
      projectId: proj('Q1 Marketing Campaign'),
      categoryId: cat('Work'),
      tags: [tag('creative'), tag('admin')]
    },
    {
      title: 'Set up Google Analytics 4 tracking',
      description: 'Configure GA4 with custom events for our main conversion funnels',
      dueDate: daysFromNow(6),
      priority: 2,
      status: 'todo',
      projectId: proj('Q1 Marketing Campaign'),
      categoryId: cat('Work'),
      tags: [tag('automation'), tag('research')]
    },

    // ── Personal / Home ───────────────────────────────────────────────────────
    {
      title: 'Get quotes from 3 contractors',
      description: 'Compare pricing for kitchen countertop replacement',
      dueDate: daysFromNow(5),
      priority: 2,
      status: 'in_progress',
      projectId: proj('Home Renovation'),
      categoryId: cat('Home'),
      tags: [tag('follow-up'), tag('research')]
    },
    {
      title: 'Order bathroom tiles from supplier',
      description: 'Selected the marble-look porcelain tiles — need to order 45 sqm',
      dueDate: daysFromNow(10),
      priority: 2,
      status: 'todo',
      projectId: proj('Home Renovation'),
      categoryId: cat('Home'),
      tags: [tag('admin')]
    },
    {
      title: 'Declutter garage',
      description: 'Sort through boxes, donate old items, organize tools',
      dueDate: daysFromNow(15),
      priority: 4,
      status: 'todo',
      categoryId: cat('Home'),
      tags: [tag('quick-win')]
    },
    {
      title: 'Fix leaking kitchen faucet',
      description: 'Replace washer or cartridge — been dripping for a week',
      dueDate: daysFromNow(2),
      priority: 1,
      status: 'todo',
      categoryId: cat('Home'),
      tags: [tag('urgent'), tag('quick-win')]
    },

    // ── Learning ──────────────────────────────────────────────────────────────
    {
      title: 'Complete TypeScript Generics module',
      description: 'Finish the advanced generics section on the Udemy course',
      dueDate: daysFromNow(4),
      priority: 2,
      status: 'in_progress',
      projectId: proj('Learn TypeScript'),
      categoryId: cat('Learning'),
      goalId: goal('Get promoted'),
      tags: [tag('deep-work')]
    },
    {
      title: 'Build a TypeScript REST API project',
      description: 'Practice project: build a small REST API with Express + TypeScript',
      dueDate: daysFromNow(14),
      priority: 3,
      status: 'todo',
      projectId: proj('Learn TypeScript'),
      categoryId: cat('Learning'),
      tags: [tag('deep-work'), tag('creative')]
    },
    {
      title: 'Spanish lesson — Unit 12',
      description: 'Complete Duolingo unit 12 and practice speaking with tutor',
      dueDate: daysFromNow(1),
      priority: 3,
      status: 'todo',
      categoryId: cat('Learning'),
      goalId: goal('Learn conversational'),
      tags: [tag('quick-win')],
      isRecurring: true,
      recurrenceRule: 'FREQ=DAILY'
    },
    {
      title: 'Read "Clean Code" — chapters 5-8',
      description: 'Continue reading and take notes on formatting, objects, and error handling',
      dueDate: daysFromNow(7),
      priority: 3,
      status: 'todo',
      categoryId: cat('Learning'),
      goalId: goal('Read 24 books'),
      tags: [tag('deep-work')]
    },
    {
      title: 'Watch AWS Solutions Architect webinar',
      description: 'Free 2-hour webinar on AWS SA certification prep',
      dueDate: daysFromNow(9),
      priority: 4,
      status: 'todo',
      categoryId: cat('Learning'),
      tags: [tag('research')]
    },

    // ── Health & Fitness ──────────────────────────────────────────────────────
    {
      title: 'Morning run — 10K',
      description: 'Easy pace 10K run along the river trail',
      dueDate: daysFromNow(0),
      priority: 2,
      status: 'todo',
      projectId: proj('Fitness Challenge'),
      categoryId: cat('Health & Fitness'),
      goalId: goal('Run a half marathon'),
      tags: [tag('quick-win')],
      isRecurring: true,
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR'
    },
    {
      title: 'Meal prep for the week',
      description: 'Cook chicken, rice, and veggies for 5 weekday lunches',
      dueDate: daysFromNow(2),
      priority: 2,
      status: 'todo',
      projectId: proj('Fitness Challenge'),
      categoryId: cat('Health & Fitness'),
      tags: [tag('admin')],
      isRecurring: true,
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=SU'
    },
    {
      title: 'Book annual health checkup',
      description: 'Schedule appointment with Dr. Martinez — overdue by 2 months',
      dueDate: daysFromNow(3),
      priority: 1,
      status: 'todo',
      categoryId: cat('Health & Fitness'),
      tags: [tag('urgent'), tag('admin')]
    },
    {
      title: 'Research protein supplements',
      description: 'Compare whey vs plant-based protein powders — check reviews',
      dueDate: daysFromNow(6),
      priority: 4,
      status: 'todo',
      categoryId: cat('Health & Fitness'),
      tags: [tag('research')]
    },
    {
      title: 'Strength training — upper body',
      description: 'Bench press, rows, overhead press, and curls at the gym',
      dueDate: daysFromNow(1),
      priority: 2,
      status: 'done',
      projectId: proj('Fitness Challenge'),
      categoryId: cat('Health & Fitness'),
      goalId: goal('Run a half marathon'),
      tags: [tag('quick-win')],
      isRecurring: true,
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=TU,TH'
    },

    // ── Finance ───────────────────────────────────────────────────────────────
    {
      title: 'Review monthly expenses',
      description: 'Go through bank statements and categorize all transactions',
      dueDate: daysFromNow(1),
      priority: 2,
      status: 'todo',
      projectId: proj('Budget Tracker'),
      categoryId: cat('Finance'),
      goalId: goal('Save $10,000'),
      tags: [tag('admin')],
      isRecurring: true,
      recurrenceRule: 'FREQ=MONTHLY;BYMONTHDAY=1'
    },
    {
      title: 'Set up automatic savings transfer',
      description: 'Configure $500/month auto-transfer to savings account',
      dueDate: daysFromNow(2),
      priority: 1,
      status: 'done',
      categoryId: cat('Finance'),
      goalId: goal('Save $10,000'),
      tags: [tag('automation'), tag('quick-win')]
    },
    {
      title: 'File tax documents',
      description: 'Gather W-2, 1099s, and receipts for 2025 tax filing',
      dueDate: daysFromNow(30),
      priority: 2,
      status: 'todo',
      categoryId: cat('Finance'),
      tags: [tag('admin'), tag('documentation')]
    },
    {
      title: 'Research index fund options',
      description: 'Compare Vanguard, Fidelity, and Schwab total market index funds',
      dueDate: daysFromNow(14),
      priority: 3,
      status: 'todo',
      categoryId: cat('Finance'),
      goalId: goal('Save $10,000'),
      tags: [tag('research'), tag('deep-work')]
    },
    {
      title: 'Cancel unused subscriptions',
      description: 'Audit all active subscriptions and cancel the ones not being used',
      dueDate: daysFromNow(3),
      priority: 2,
      status: 'in_progress',
      categoryId: cat('Finance'),
      goalId: goal('Save $10,000'),
      tags: [tag('quick-win'), tag('admin')]
    },

    // ── Personal / Social ─────────────────────────────────────────────────────
    {
      title: 'Plan birthday party for Sarah',
      description: 'Book venue, send invites, order cake — party is on Feb 20',
      dueDate: daysFromNow(15),
      priority: 2,
      status: 'todo',
      categoryId: cat('Social'),
      tags: [tag('creative'), tag('admin')]
    },
    {
      title: 'Book club meeting — discuss "Atomic Habits"',
      description: 'Prepare discussion points and host the meeting at my place',
      dueDate: daysFromNow(8),
      priority: 3,
      status: 'todo',
      projectId: proj('Book Club'),
      categoryId: cat('Social'),
      goalId: goal('Read 24 books'),
      tags: [tag('meeting')]
    },
    {
      title: 'Call mom',
      description: 'Weekly catch-up call — ask about her knee surgery recovery',
      dueDate: daysFromNow(0),
      priority: 2,
      status: 'todo',
      categoryId: cat('Social'),
      tags: [tag('quick-win')],
      isRecurring: true,
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=SU'
    },
    {
      title: 'Organize team lunch',
      description: 'Pick a restaurant and send calendar invite to the dev team',
      dueDate: daysFromNow(4),
      priority: 3,
      status: 'todo',
      categoryId: cat('Social'),
      goalId: goal('Improve work-life'),
      tags: [tag('meeting'), tag('follow-up')]
    },

    // ── Personal misc ─────────────────────────────────────────────────────────
    {
      title: 'Renew passport',
      description: 'Current passport expires in April — need to submit renewal application',
      dueDate: daysFromNow(20),
      priority: 2,
      status: 'todo',
      categoryId: cat('Personal'),
      tags: [tag('admin')]
    },
    {
      title: 'Update resume and LinkedIn',
      description: 'Add recent project experience and update skills section',
      dueDate: daysFromNow(7),
      priority: 3,
      status: 'todo',
      categoryId: cat('Personal'),
      goalId: goal('Get promoted'),
      tags: [tag('documentation'), tag('follow-up')]
    },
    {
      title: 'Back up photos to cloud',
      description: 'Upload the last 6 months of photos from phone to Google Photos',
      dueDate: daysFromNow(5),
      priority: 4,
      status: 'todo',
      categoryId: cat('Personal'),
      tags: [tag('admin'), tag('quick-win')]
    },
    {
      title: 'Buy new running shoes',
      description: 'Current pair has 500+ miles — look at Nike Pegasus or Brooks Ghost',
      dueDate: daysFromNow(3),
      priority: 3,
      status: 'todo',
      categoryId: cat('Personal'),
      goalId: goal('Run a half marathon'),
      tags: [tag('research')]
    },

    // ── Overdue tasks (for testing) ───────────────────────────────────────────
    {
      title: 'Submit expense report — January',
      description: 'Compile receipts and submit through the expense portal',
      dueDate: daysAgo(5),
      priority: 1,
      status: 'todo',
      categoryId: cat('Work'),
      tags: [tag('urgent'), tag('admin')]
    },
    {
      title: 'Reply to client email from Acme Corp',
      description: 'They asked about the updated project timeline — need to respond ASAP',
      dueDate: daysAgo(2),
      priority: 1,
      status: 'todo',
      categoryId: cat('Work'),
      tags: [tag('urgent'), tag('follow-up')]
    },
    {
      title: 'Return library books',
      description: '3 books overdue — need to return and pay late fees',
      dueDate: daysAgo(7),
      priority: 3,
      status: 'todo',
      categoryId: cat('Personal'),
      tags: [tag('quick-win')]
    },
    {
      title: 'Pay electricity bill',
      description: 'Due date was last week — pay online to avoid further penalty',
      dueDate: daysAgo(3),
      priority: 1,
      status: 'todo',
      categoryId: cat('Finance'),
      tags: [tag('urgent'), tag('quick-win')]
    },

    // ── Completed tasks (for statistics) ──────────────────────────────────────
    {
      title: 'Set up development environment',
      description: 'Install Node.js, VS Code extensions, and configure ESLint + Prettier',
      dueDate: daysAgo(14),
      priority: 2,
      status: 'done',
      projectId: proj('Website Redesign'),
      categoryId: cat('Work'),
      tags: [tag('automation')]
    },
    {
      title: 'Complete onboarding paperwork',
      description: 'Fill out all HR forms and submit tax documents',
      dueDate: daysAgo(20),
      priority: 1,
      status: 'done',
      categoryId: cat('Work'),
      tags: [tag('admin')]
    },
    {
      title: 'Run first 5K of the year',
      description: 'Completed the New Year 5K run in 28 minutes',
      dueDate: daysAgo(30),
      priority: 2,
      status: 'done',
      projectId: proj('Fitness Challenge'),
      categoryId: cat('Health & Fitness'),
      goalId: goal('Run a half marathon'),
      tags: [tag('quick-win')]
    },
    {
      title: 'Finish reading "The Pragmatic Programmer"',
      description: 'Completed all chapters and wrote summary notes',
      dueDate: daysAgo(10),
      priority: 3,
      status: 'done',
      categoryId: cat('Learning'),
      goalId: goal('Read 24 books'),
      tags: [tag('deep-work')]
    },
    {
      title: 'Set up budget spreadsheet',
      description: 'Created a detailed monthly budget tracker in Google Sheets',
      dueDate: daysAgo(25),
      priority: 2,
      status: 'done',
      projectId: proj('Budget Tracker'),
      categoryId: cat('Finance'),
      goalId: goal('Save $10,000'),
      tags: [tag('admin'), tag('automation')]
    },
    {
      title: 'Clean out email inbox',
      description: 'Unsubscribed from 30+ newsletters and organized folders',
      dueDate: daysAgo(8),
      priority: 4,
      status: 'done',
      categoryId: cat('Personal'),
      tags: [tag('quick-win'), tag('admin')]
    },
    {
      title: 'Attend React conference talk',
      description: 'Watched the React Conf 2025 keynote and took notes',
      dueDate: daysAgo(12),
      priority: 3,
      status: 'done',
      categoryId: cat('Learning'),
      tags: [tag('research')]
    }
  ];

  const tasks = await Task.insertMany(taskData);
  console.log(`✅ Created ${tasks.length} tasks`);

  // ── Summary ─────────────────────────────────────────────────────────────────
  const todoCount = tasks.filter((t) => t.status === 'todo').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const overdueCount = tasks.filter(
    (t) => t.status !== 'done' && t.dueDate && t.dueDate < now
  ).length;
  const recurringCount = tasks.filter((t) => t.isRecurring).length;

  console.log('\n📊 Seed Summary:');
  console.log(`   Categories: ${categories.length}`);
  console.log(`   Projects:   ${projects.length}`);
  console.log(`   Goals:      ${goals.length}`);
  console.log(`   Tags:       ${tags.length}`);
  console.log(`   Tasks:      ${tasks.length}`);
  console.log(`     ├─ Todo:        ${todoCount}`);
  console.log(`     ├─ In Progress: ${inProgressCount}`);
  console.log(`     ├─ Done:        ${doneCount}`);
  console.log(`     ├─ Overdue:     ${overdueCount}`);
  console.log(`     └─ Recurring:   ${recurringCount}`);
  console.log('\n🎉 Seed complete!');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
