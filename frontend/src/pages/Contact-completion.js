                      <input 
                        type="file" 
                        id="file" 
                        name="file"
                        onChange={handleFileChange}
                        className="form-control"
                      />
                      <p className="file-help">Max size: 5MB</p>
                    </div>

                    <button 
                      type="submit" 
                      className="send-button"
                      disabled={isSubmitting}
                    >
                      <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                      <FaPaperPlane className={isSubmitting ? 'sending' : ''} />
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Floating music icons */}
        <div className="floating-icons">
          <FaHeadphones className="floating-icon icon-1" />
          <FaKeyboard className="floating-icon icon-2" />
          <FaLaptop className="floating-icon icon-3" />
          <FaGuitar className="floating-icon icon-4" />
          <FaMicrophone className="floating-icon icon-5" />
          <FaRecordVinyl className="floating-icon icon-6" />
        </div>

        {/* Music notes animations */}
        {musicNotes.map(note => (
          <div key={note.id} className="music-note" style={note.style}>
            {React.createElement(note.icon)}
          </div>
        ))}

        {/* CTA Button to scroll to form section */}
        <button 
          className="cta-button"
          onClick={scrollToForm}
        >
          <span>Contact Us</span>
          <FaEnvelope />
        </button>
      </div>

      {/* Wave animation at bottom of hero */}
    </section>
  </>
);
};

export default Contact;
