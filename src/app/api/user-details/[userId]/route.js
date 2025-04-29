// app/api/user-details/[userId]/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserDetail from '@/models/UserDetail';
import User from '@/models/User';
import mongoose from 'mongoose';

// GET handler to retrieve specific user details (for admin or authorized purposes)
export async function GET(request, { params }) {
  try {
    // Connect to MongoDB
    await connectDB();
    
    const { userId } = params;
    
    // Validate user ID format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }
    
    // Check if admin or authorized to view this user's details
    // This is a placeholder - implement your actual auth strategy
    const requesterId = request.headers.get('x-user-id');
    const isAdmin = request.headers.get('x-is-admin') === 'true';
    
    if (!isAdmin && requesterId !== userId) {
      return NextResponse.json(
        { error: 'Not authorized to view this user\'s details' },
        { status: 403 }
      );
    }
    
    // Find user details
    const userDetails = await UserDetail.findOne({ user: userId });
    
    if (!userDetails) {
      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      // User exists but has no details yet
      return NextResponse.json({
        user: userId,
        skills: [],
        qualifications: [],
        interests: [],
        is_subscribed: false
      }, { status: 200 });
    }
    
    return NextResponse.json(userDetails, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user details', details: error.message },
      { status: 500 }
    );
  }
}

// PUT handler to update specific user details
export async function PUT(request, { params }) {
  try {
    // Connect to MongoDB
    await connectDB();
    
    const { userId } = params;
    
    // Validate user ID format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }
    
    // Check if authorized to update this user's details
    // This is a placeholder - implement your actual auth strategy
    const requesterId = request.headers.get('x-user-id');
    const isAdmin = request.headers.get('x-is-admin') === 'true';
    
    if (!isAdmin && requesterId !== userId) {
      return NextResponse.json(
        { error: 'Not authorized to update this user\'s details' },
        { status: 403 }
      );
    }
    
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Parse request body
    const updateData = await request.json();
    
    // Find and update user details (create if doesn't exist)
    let userDetails = await UserDetail.findOne({ user: userId });
    
    if (userDetails) {
      // Update existing document
      Object.keys(updateData).forEach(key => {
        if (key !== 'user' && key !== '_id') { // Prevent changing immutable fields
          userDetails[key] = updateData[key];
        }
      });
      
      await userDetails.save();
    } else {
      // Create new user details document
      userDetails = await UserDetail.create({
        user: userId,
        ...updateData
      });
    }
    
    return NextResponse.json({
      message: 'User details updated successfully',
      userDetails
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error updating user details:', error);
    return NextResponse.json(
      { error: 'Failed to update user details', details: error.message },
      { status: 500 }
    );
  }
}