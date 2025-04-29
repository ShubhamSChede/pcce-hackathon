// app/api/job-interests/[id]/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserJobInterest from '@/models/UserJobInterest';
import mongoose from 'mongoose';

// GET handler to retrieve a specific job interest
export async function GET(request, { params }) {
  try {
    // Connect to MongoDB
    await connectDB();
    
    const { id } = params;
    
    // Validate job interest ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid job interest ID format' },
        { status: 400 }
      );
    }
    
    // Find the job interest
    const jobInterest = await UserJobInterest.findById(id).populate('job');
    
    if (!jobInterest) {
      return NextResponse.json(
        { error: 'Job interest not found' },
        { status: 404 }
      );
    }
    
    // Verify the requester owns this job interest or is admin
    // This is a placeholder - implement your actual auth strategy
    const userId = request.headers.get('x-user-id');
    const isAdmin = request.headers.get('x-is-admin') === 'true';
    
    if (!isAdmin && (!userId || jobInterest.user.toString() !== userId)) {
      return NextResponse.json(
        { error: 'Not authorized to view this job interest' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(jobInterest, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching job interest:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job interest', details: error.message },
      { status: 500 }
    );
  }
}

// PUT handler to update a specific job interest
export async function PUT(request, { params }) {
  try {
    // Connect to MongoDB
    await connectDB();
    
    const { id } = params;
    
    // Validate job interest ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid job interest ID format' },
        { status: 400 }
      );
    }
    
    // Find the job interest
    const jobInterest = await UserJobInterest.findById(id);
    
    if (!jobInterest) {
      return NextResponse.json(
        { error: 'Job interest not found' },
        { status: 404 }
      );
    }
    
    // Verify the requester owns this job interest or is admin
    // This is a placeholder - implement your actual auth strategy
    const userId = request.headers.get('x-user-id');
    const isAdmin = request.headers.get('x-is-admin') === 'true';
    
    if (!isAdmin && (!userId || jobInterest.user.toString() !== userId)) {
      return NextResponse.json(
        { error: 'Not authorized to update this job interest' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const { status, notes } = await request.json();
    
    // Update job interest
    if (status) jobInterest.status = status;
    if (notes !== undefined) jobInterest.notes = notes;
    
    await jobInterest.save();
    
    return NextResponse.json({
      message: 'Job interest updated successfully',
      jobInterest
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error updating job interest:', error);
    return NextResponse.json(
      { error: 'Failed to update job interest', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE handler to remove a specific job interest
export async function DELETE(request, { params }) {
  try {
    // Connect to MongoDB
    await connectDB();
    
    const { id } = params;
    
    // Validate job interest ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid job interest ID format' },
        { status: 400 }
      );
    }
    
    // Find the job interest
    const jobInterest = await UserJobInterest.findById(id);
    
    if (!jobInterest) {
      return NextResponse.json(
        { error: 'Job interest not found' },
        { status: 404 }
      );
    }
    
    // Verify the requester owns this job interest or is admin
    // This is a placeholder - implement your actual auth strategy
    const userId = request.headers.get('x-user-id');
    const isAdmin = request.headers.get('x-is-admin') === 'true';
    
    if (!isAdmin && (!userId || jobInterest.user.toString() !== userId)) {
      return NextResponse.json(
        { error: 'Not authorized to delete this job interest' },
        { status: 403 }
      );
    }
    
    // Delete the job interest
    await UserJobInterest.findByIdAndDelete(id);
    
    return NextResponse.json({
      message: 'Job interest deleted successfully'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error deleting job interest:', error);
    return NextResponse.json(
      { error: 'Failed to delete job interest', details: error.message },
      { status: 500 }
    );
  }
}