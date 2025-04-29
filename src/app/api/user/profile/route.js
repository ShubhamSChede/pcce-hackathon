// app/api/user/profile/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import mongoose from 'mongoose';

// GET handler to retrieve user profile
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
    
    // Find user but exclude the password field
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile', details: error.message },
      { status: 500 }
    );
  }
}

// PUT handler to update user profile
export async function PUT(request) {
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
    const updateData = await request.json();
    const { full_name, phone } = updateData;
    
    // Find user
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Update user fields
    if (full_name !== undefined) user.full_name = full_name;
    if (phone !== undefined) user.phone = phone;
    
    await user.save();
    
    // Return updated user without password
    const updatedUser = await User.findById(userId).select('-password');
    
    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update user profile', details: error.message },
      { status: 500 }
    );
  }
}