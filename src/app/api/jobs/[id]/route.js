// app/api/jobs/[id]/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import JobOpportunity from '@/models/JobOpportunity';
import mongoose from 'mongoose';

// GET handler to retrieve a specific job by ID
export async function GET(request, { params }) {
  try {
    // Connect to MongoDB
    await connectDB();
    
    const { id } = params;
    
    // Validate job ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid job ID format' },
        { status: 400 }
      );
    }
    
    // Find the job by ID
    const job = await JobOpportunity.findById(id);
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job opportunity not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(job, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job opportunity', details: error.message },
      { status: 500 }
    );
  }
}

// PUT handler to update a specific job by ID
export async function PUT(request, { params }) {
  try {
    // Connect to MongoDB
    await connectDB();
    
    const { id } = params;
    const updateData = await request.json();
    
    // Validate job ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid job ID format' },
        { status: 400 }
      );
    }
    
    // Find and update the job
    const job = await JobOpportunity.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job opportunity not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: 'Job opportunity updated successfully',
      job
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { error: 'Failed to update job opportunity', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE handler to remove a specific job by ID
export async function DELETE(request, { params }) {
  try {
    // Connect to MongoDB
    await connectDB();
    
    const { id } = params;
    
    // Validate job ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid job ID format' },
        { status: 400 }
      );
    }
    
    // Find and delete the job
    const job = await JobOpportunity.findByIdAndDelete(id);
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job opportunity not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: 'Job opportunity deleted successfully'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json(
      { error: 'Failed to delete job opportunity', details: error.message },
      { status: 500 }
    );
  }
}