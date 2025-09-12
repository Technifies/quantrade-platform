import streamlit as st

st.title("🧪 Streamlit Test")
st.write("✅ Streamlit is working!")

if st.button("Test Button"):
    st.success("✅ Button clicked successfully!")

st.metric("Test Metric", "100%")
st.info("This is a simple test to verify Streamlit is functioning correctly.")

# Test basic functionality
st.subheader("Basic Components Test")
col1, col2 = st.columns(2)

with col1:
    st.write("Column 1 content")

with col2:
    st.write("Column 2 content")

st.sidebar.title("Sidebar Test")
st.sidebar.success("Sidebar is working!")