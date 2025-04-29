import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';

export async function POST(request) {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Parse request body
    const { email, phone, password } = await request.json();
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 }
      );
    }
    
    // Create new user
    const user = await User.create({
      email,
      phone,
      password, // Will be hashed via pre-save hook
      full_name: '' // Can be updated later
    });
    
    // Return success response with user data (excluding password)
    return NextResponse.json({
      message: 'Registration successful',
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Registration failed', error: error.message },
      { status: 500 }
    );
  }
}