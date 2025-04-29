// app/api/jobs/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import JobOpportunity from '@/models/JobOpportunity';

// GET handler to retrieve job opportunities
export async function GET(request) {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');
    const location = searchParams.get('location');
    const company = searchParams.get('company');
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const skip = (page - 1) * limit;
    
    // Build query object
    const query = {};
    if (tag) query.tags = { $in: [tag] };
    if (location) query.location = new RegExp(location, 'i');
    if (company) query.company = new RegExp(company, 'i');
    
    // Fetch jobs with pagination
    const jobs = await JobOpportunity.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Count total matching documents for pagination
    const totalJobs = await JobOpportunity.countDocuments(query);
    
    return NextResponse.json({
      jobs,
      pagination: {
        total: totalJobs,
        page,
        limit,
        pages: Math.ceil(totalJobs / limit)
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job opportunities', details: error.message },
      { status: 500 }
    );
  }
}

// POST handler to create a new job opportunity
export async function POST(request) {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Parse request body
    const jobData = await request.json();
    
    // Validate required fields
    if (!jobData.title || !jobData.company) {
      return NextResponse.json(
        { error: 'Title and company are required fields' },
        { status: 400 }
      );
    }
    
    // Create new job opportunity
    const job = await JobOpportunity.create(jobData);
    
    return NextResponse.json({
      message: 'Job opportunity created successfully',
      job
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Failed to create job opportunity', details: error.message },
      { status: 500 }
    );
  }
}