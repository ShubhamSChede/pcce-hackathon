// app/api/job-interests/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserJobInterest from '@/models/UserJobInterest';
import JobOpportunity from '@/models/JobOpportunity';
import mongoose from 'mongoose';

// GET handler to retrieve all job interests for a user
export async function GET(request) {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Get user ID from request headers or auth token
    // This is a placeholder - implement your actual auth strategy
    const userId = request.headers.get('x-user-id');
    
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: 'Unauthorized or invalid user ID' },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // Filter by status if provided
    
    // Build query object
    const query = { user: userId };
    if (status) query.status = status;
    
    // Find user's job interests
    const jobInterests = await UserJobInterest.find(query)
      .populate('job')
      .sort({ createdAt: -1 });
    
    return NextResponse.json(jobInterests, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching job interests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job interests', details: error.message },
      { status: 500 }
    );
  }
}

// POST handler to create a new job interest
export async function POST(request) {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Get user ID from request headers or auth token
    // This is a placeholder - implement your actual auth strategy
    const userId = request.headers.get('x-user-id');
    
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: 'Unauthorized or invalid user ID' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const { jobId, status, notes } = await request.json();
    
    // Validate required fields
    if (!jobId || !status) {
      return NextResponse.json(
        { error: 'Job ID and status are required' },
        { status: 400 }
      );
    }
    
    // Validate job ID format
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return NextResponse.json(
        { error: 'Invalid job ID format' },
        { status: 400 }
      );
    }
    
    // Check if job exists
    const job = await JobOpportunity.findById(jobId);
    if (!job) {
      return NextResponse.json(
        { error: 'Job opportunity not found' },
        { status: 404 }
      );
    }
    
    // Check if user already has an interest in this job
    let jobInterest = await UserJobInterest.findOne({ user: userId, job: jobId });
    
    if (jobInterest) {
      // Update existing interest
      jobInterest.status = status;
      if (notes !== undefined) jobInterest.notes = notes;
      await jobInterest.save();
      
      return NextResponse.json({
        message: 'Job interest updated successfully',
        jobInterest
      }, { status: 200 });
    } else {
      // Create new job interest
      jobInterest = await UserJobInterest.create({
        user: userId,
        job: jobId,
        status,
        notes: notes || ''
      });
      
      return NextResponse.json({
        message: 'Job interest created successfully',
        jobInterest
      }, { status: 201 });
    }
    
  } catch (error) {
    console.error('Error creating job interest:', error);
    
    // Handle duplicate key error (user already interested in this job)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'You already have an interest in this job' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create job interest', details: error.message },
      { status: 500 }
    );
  }
}
