import React, { useState, useEffect } from 'react';
import { Icon, Spin } from 'antd';
import './loading.css'
import * as loginRedux from '@app/redux/models/login'
import { withRouter } from "react-router-dom";
import { connect } from 'react-redux';

const CristalSvg = () => (
  <svg
   viewBox="0 0 195 193"
   height="50"
   width="50"
   id="svg2"
   version="1.1"
   className="cristal_loading">
    <g
       transform="matrix(1.3333333,0,0,-1.3333333,-597.59237,701.30353)"
       id="g10">
      <g
         id="g14">
        <g
           clipPath="url(#clipPath20)"
           id="g16">
          <g
             style={{fill:'#6c54a3',fillOpacity:1}}
             id="g900">
            <g
               style={{fill:'#6c54a3',fillOpacity:1}}
               id="g26"
               transform="translate(514.28019,519.71666)">
              <path
                 d="m 0,0 c 0,3.45 2.818,6.261 6.264,6.261 3.444,0 6.261,-2.811 6.261,-6.261 0,-3.441 -2.817,-6.258 -6.261,-6.258 H 5.632 C 2.504,-5.941 0,-3.13 0,0 m 31.312,-11.267 c -3.137,1.249 -4.696,5.009 -3.447,8.137 1.255,3.13 5.015,4.698 8.142,3.446 3.134,-1.249 4.693,-5.009 3.447,-8.142 -1.255,-2.501 -3.76,-4.07 -6.264,-3.757 -0.629,0 -1.259,0 -1.878,0.316 m -57.918,2.508 c -1.571,3.127 0,6.884 3.127,8.452 3.128,1.559 6.891,0 8.45,-3.134 1.571,-3.127 0,-6.886 -3.124,-8.455 -0.946,-0.629 -2.198,-0.629 -3.134,-0.629 -2.505,0.316 -4.39,1.881 -5.319,3.766 M 51.97,-25.98 c -2.498,2.501 -2.185,6.571 0.313,8.762 2.504,2.192 6.574,2.192 8.772,-0.316 2.498,-2.504 2.188,-6.577 -0.32,-8.762 -1.249,-1.252 -3.127,-1.882 -5.005,-1.553 -1.249,0 -2.818,0.927 -3.76,1.869 m -99.557,-1.568 c -2.507,2.201 -2.821,6.261 -0.626,8.762 2.195,2.504 6.261,2.817 8.765,0.636 2.499,-2.195 2.818,-6.271 0.623,-8.772 -1.249,-1.559 -3.434,-2.192 -5.318,-2.192 -1.253,0.313 -2.501,0.936 -3.444,1.566 M 64.811,-47.584 c -1.258,3.45 0.626,6.878 4.067,7.827 3.447,1.245 6.884,-0.627 7.823,-4.07 1.255,-3.447 -0.623,-6.89 -4.057,-7.823 -0.946,-0.32 -1.884,-0.32 -2.504,-0.32 -2.511,0.32 -4.39,1.879 -5.329,4.386 m -123.978,-5.325 c -3.449,0.939 -5.325,4.689 -4.076,7.826 0.94,3.447 4.69,5.326 7.83,4.07 3.44,-0.936 5.005,-4.692 4.066,-7.826 -0.942,-2.811 -3.75,-4.696 -6.574,-4.38 -0.313,0 -0.632,0 -1.246,0.31 M 67.629,-72.947 v 0 c 0.31,3.753 3.443,6.254 6.887,5.951 3.44,-0.316 5.948,-3.45 5.635,-6.89 -0.31,-3.441 -3.45,-5.945 -6.891,-5.639 -3.446,0 -5.944,2.821 -5.631,6.578 M -66.06,-75.455 v 0 c -0.31,3.457 2.198,6.577 5.635,6.894 3.443,0.306 6.577,-2.192 6.884,-5.645 0.319,-3.434 -2.179,-6.568 -5.626,-6.877 h -1.258 c -2.818,0.309 -5.325,2.501 -5.635,5.628 m 128.364,-30.363 c -3.131,1.566 -4.07,5.642 -2.502,8.449 1.559,3.128 5.635,4.077 8.453,2.508 3.127,-1.565 4.07,-5.641 2.505,-8.452 -1.253,-2.192 -3.76,-3.45 -5.949,-3.134 -0.622,0 -1.568,0 -2.507,0.629 m -118.663,1.256 c -1.875,3.13 -0.623,6.89 2.195,8.765 3.137,1.878 6.893,0.626 8.768,-2.191 1.889,-3.127 0.627,-6.897 -2.191,-8.775 -1.249,-0.627 -2.507,-0.93 -3.76,-0.93 -2.194,0.303 -4.066,1.246 -5.012,3.131 m 98.318,-20.361 c -2.195,2.827 -1.569,6.896 1.249,8.771 2.817,2.198 6.883,1.572 8.762,-1.261 2.194,-2.805 1.568,-6.875 -1.249,-8.756 -1.249,-0.933 -2.821,-1.252 -4.386,-1.252 -1.569,0 -3.444,0.942 -4.376,2.498 m -77.65,-2.179 c -2.814,1.869 -3.444,5.938 -1.559,8.753 1.879,2.827 5.948,3.45 8.766,1.568 2.807,-1.875 3.44,-5.938 1.568,-8.765 -1.261,-1.875 -3.456,-2.808 -5.644,-2.498 -1.25,0 -2.186,0.306 -3.131,0.942 m 51.027,-7.2 c -0.613,3.434 1.259,6.881 4.703,7.513 3.443,0.62 6.89,-1.255 7.513,-4.709 0.623,-3.44 -1.259,-6.883 -4.696,-7.506 -0.623,-0.313 -1.255,-0.313 -1.875,0 -2.817,0 -5.012,1.875 -5.645,4.702 m -22.849,-5.015 v 0 c -3.447,0.623 -5.635,4.073 -5.015,7.503 0.635,3.46 4.079,5.645 7.523,5.025 3.44,-0.632 5.631,-4.079 5.005,-7.513 -0.629,-3.147 -3.756,-5.328 -6.89,-5.015 z"
                 style={{fill:'#6c54a3',fillOpacity:1, fillRule:'nonzero', stroke:'none'}}
                 id="path28"
                 />
            </g>
            <g
               style={{fill:'#6c54a3',fillOpacity:1}}
               id="g30"
               transform="translate(521.32249,501.62426)">
              <path
                 d="m 0,0 c -26.664,0 -48.355,-21.726 -48.355,-48.449 0,-26.722 21.691,-48.458 48.355,-48.458 26.667,0 48.362,21.736 48.362,48.458 C 48.362,-21.726 26.667,0 0,0 m 0,-89.555 c -22.611,0 -41.01,18.441 -41.01,41.106 0,21.352 16.337,38.945 37.134,40.907 -2.769,-0.881 -5.444,-2.021 -7.939,-3.46 -8.795,-5.054 -15.466,-13.368 -18.409,-22.746 -1.491,-4.696 -2.088,-9.553 -1.859,-14.397 0.274,-4.864 1.643,-9.624 3.921,-13.816 4.609,-8.395 12.803,-14.378 21.707,-16.311 4.419,-0.943 9.043,-1.13 13.439,-0.013 4.37,1.061 8.404,3.211 11.599,6.177 3.237,2.927 5.673,6.616 7.081,10.602 1.41,3.992 1.975,8.168 1.316,12.305 -1.21,8.295 -7.474,15.027 -14.816,17.221 -7.203,2.382 -15.885,0.12 -20.039,-5.78 -2.12,-2.795 -3.537,-6.154 -3.592,-9.533 -0.264,-3.36 0.736,-6.784 2.65,-9.372 1.881,-2.65 4.686,-4.438 7.61,-5.18 0.716,-0.275 1.456,-0.349 2.207,-0.407 0.736,-0.039 1.462,-0.194 2.211,-0.058 1.491,0.09 2.931,0.5 4.218,1.123 2.595,1.278 4.535,3.492 5.513,5.961 0.968,2.462 1.029,5.183 0.119,7.523 -0.917,2.317 -2.753,4.079 -4.815,4.951 -2.062,0.861 -4.328,0.968 -6.261,0.222 -1.917,-0.745 -3.337,-2.249 -4.021,-3.898 -0.678,-1.65 -0.733,-3.425 -0.178,-4.903 0.562,-1.471 1.662,-2.54 2.824,-3.091 1.175,-0.552 2.372,-0.723 3.411,-0.494 2.114,0.477 3.069,2.033 3.315,2.995 0.142,0.49 0.164,0.878 0.132,1.136 -0.016,0.251 -0.042,0.377 -0.077,0.377 -0.133,0.013 -0.091,-0.516 -0.494,-1.352 -0.346,-0.813 -1.304,-2.011 -3.014,-2.256 -1.64,-0.219 -4.045,0.752 -4.822,3.118 -0.368,1.123 -0.262,2.527 0.313,3.802 0.581,1.274 1.723,2.394 3.195,2.904 1.436,0.513 3.227,0.384 4.828,-0.329 1.591,-0.72 2.975,-2.127 3.634,-3.902 0.31,-0.904 0.474,-1.852 0.419,-2.85 -0.058,-0.503 -0.116,-1.01 -0.177,-1.523 -0.158,-0.484 -0.323,-0.984 -0.484,-1.481 -0.814,-1.927 -2.369,-3.637 -4.393,-4.583 -2.004,-0.997 -4.437,-1.039 -6.793,-0.403 -2.346,0.606 -4.557,2.097 -6.019,4.214 -1.498,2.089 -2.253,4.719 -2.023,7.446 0.038,2.785 1.29,5.49 3.007,7.765 0.491,0.523 0.865,1.175 1.456,1.617 l 1.704,1.391 c 1.291,0.7 2.575,1.481 4.06,1.804 l 1.081,0.329 1.133,0.094 c 0.768,0.032 1.504,0.242 2.298,0.125 1.578,-0.009 3.136,-0.371 4.673,-0.793 6.119,-1.885 11.292,-7.51 12.264,-14.343 1,-6.806 -1.669,-14.497 -7.217,-19.428 -2.723,-2.521 -6.131,-4.36 -9.836,-5.232 -3.67,-0.936 -7.688,-0.8 -11.57,0.039 -7.756,1.701 -14.882,6.919 -18.893,14.207 -1.998,3.64 -3.163,7.765 -3.409,11.983 -0.203,4.234 0.323,8.643 1.643,12.793 2.631,8.343 8.556,15.772 16.385,20.277 2.928,1.724 17.819,7.575 30.053,2.153 C 33.335,-19.596 41.01,-33.225 41.01,-48.449 41.01,-71.114 22.611,-89.555 0,-89.555"
                 style={{fill:'#6c54a3',fillOpacity:1, fillRule:'nonzero', stroke:'none'}}
                 id="path32"
                 />
            </g>
          </g>
        </g>
      </g>
    </g>
  </svg> );

//
const CristalIcon = props => <Icon component={CristalSvg} {...props} />;

//
const Loading = (props) => {
  
  return (<div style={{width:'100%', height:'100%', margin: '0 auto', paddingTop:100, textAlign:'center'}}>
           <CristalIcon />
          </div>) ;
  }
//
export default Loading;


/*
const Loading = (props) => {

  const [isAuth, setIsAuth] = useState(props.isAuth)
  useEffect(() => {
      setIsAuth(props.isAuth);
    }, [props.isAuth]);
  
  var t_out = null;
  if(isAuth)
  {  
    clearTimeout(t_out);
    t_out = setTimeout(()=> {
      props.history.push('/')
    } ,1000);
  }
  else{
    clearTimeout(t_out);
    t_out = setTimeout(()=> {
      props.history.push('/login')
    } ,1000);
  }

  const spin = <CristalIcon />;
  return (<div style={{width:'100%', height:'100%', margin: '0 auto', paddingTop:100, textAlign:'center'}}>
        {spin}
      </div>) 
  }
//
export default withRouter(connect(
    (state)=> ({
        isAuth:           loginRedux.isAuth(state)
    })
)( Loading) );

*/