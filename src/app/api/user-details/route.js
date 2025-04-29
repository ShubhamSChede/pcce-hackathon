// app/api/user-details/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserDetail from '@/models/UserDetail';
import User from '@/models/User';
import mongoose from 'mongoose';

// Make sure to explicitly export the POST handler with the exact name 'POST'
export async function POST(request) {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Get user ID from request headers
    const userId = request.headers.get('x-user-id');
    
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: 'Unauthorized or invalid user ID' },
        { status: 401 }
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
    const bodyText = await request.text();
    console.log('Raw request body:', bodyText);
    
    let detailData;
    try {
      detailData = JSON.parse(bodyText);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body', details: parseError.message },
        { status: 400 }
      );
    }
    
    console.log('Parsed request data:', detailData);
    
    const { skills, qualifications, interests, is_subscribed } = detailData;
    
    // Find existing user details or create new document
    let userDetails = await UserDetail.findOne({ user: userId });
    
    if (userDetails) {
      // Update existing user details
      userDetails.skills = skills || userDetails.skills;
      userDetails.qualifications = qualifications || userDetails.qualifications;
      userDetails.interests = interests || userDetails.interests;
      userDetails.is_subscribed = is_subscribed !== undefined ? is_subscribed : userDetails.is_subscribed;
      
      await userDetails.save();
    } else {
      // Create new user details
      userDetails = await UserDetail.create({
        user: userId,
        skills: skills || [],
        qualifications: qualifications || [],
        interests: interests || [],
        is_subscribed: is_subscribed || false
      });
    }
    
    return NextResponse.json({
      message: 'User details saved successfully',
      userDetails
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error saving user details:', error);
    return NextResponse.json(
      { error: 'Failed to save user details', details: error.message },
      { status: 500 }
    );
  }
}

// GET handler to retrieve user details (require authentication)
export async function GET(request) {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Get user ID from request headers or auth token
    const userId = request.headers.get('x-user-id');
    
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: 'Unauthorized or invalid user ID' },
        { status: 401 }
      );
    }
    
    // Find user details
    let userDetails = await UserDetail.findOne({ user: userId });
    
    // If user details don't exist yet, return empty defaults
    if (!userDetails) {
      const user = await User.findById(userId);
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      // Return default structure but don't create in DB
      userDetails = {
        user: userId,
        skills: [],
        qualifications: [],
        interests: [],
        is_subscribed: false
      };
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
